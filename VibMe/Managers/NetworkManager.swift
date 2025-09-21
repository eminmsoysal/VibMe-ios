import Foundation
import Network
import Combine

@MainActor
class NetworkManager: ObservableObject {
    @Published var isOnline = false
    @Published var discoveredDevices: [NetworkDevice] = []
    @Published var connectedConnections: [String: NWConnection] = [:]
    
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "NetworkManager")
    private var listener: NWListener?
    private let vibmePort: NWEndpoint.Port = 8888
    
    // WebSocket connections for online mode
    private var webSocketConnections: [String: URLSessionWebSocketTask] = [:]
    
    init() {
        setupNetworkMonitoring()
        startListening()
    }
    
    deinit {
        stopListening()
        monitor.cancel()
    }
    
    // MARK: - Public Methods
    
    func discoverDevices() {
        // Simulate device discovery on local network
        // In a real implementation, this would use Bonjour/mDNS
        let sampleNetworkDevices = [
            NetworkDevice(
                name: "Living Room Device",
                ipAddress: "192.168.1.100",
                port: 8888,
                deviceType: .androidPhone
            ),
            NetworkDevice(
                name: "Bedroom Device", 
                ipAddress: "192.168.1.101",
                port: 8888,
                deviceType: .smartWatch
            ),
            NetworkDevice(
                name: "Office Computer",
                ipAddress: "192.168.1.102",
                port: 8888,
                deviceType: .windowsPC
            )
        ]
        
        discoveredDevices = sampleNetworkDevices
    }
    
    func connect(to address: String) async -> Bool {
        // Try to connect via local network first
        if let success = await connectLocal(to: address), success {
            return true
        }
        
        // Fall back to online connection
        return await connectOnline(to: address)
    }
    
    func disconnect(from address: String) {
        // Disconnect local connection
        connectedConnections[address]?.cancel()
        connectedConnections.removeValue(forKey: address)
        
        // Disconnect WebSocket connection
        webSocketConnections[address]?.cancel(with: .normalClosure, reason: nil)
        webSocketConnections.removeValue(forKey: address)
    }
    
    func sendVibrationCommand(_ command: VibrationCommand) {
        let targetId = command.targetDeviceId
        
        // Try local connection first
        if let connection = connectedConnections[targetId] {
            sendCommandViaLocal(command, connection: connection)
        } else if let webSocket = webSocketConnections[targetId] {
            sendCommandViaWebSocket(command, webSocket: webSocket)
        } else {
            print("No connection found for device: \(targetId)")
        }
    }
    
    // MARK: - Local Network Methods
    
    private func connectLocal(to address: String) async -> Bool {
        guard let host = NWEndpoint.Host(address) else { return false }
        
        let connection = NWConnection(
            host: host,
            port: vibmePort,
            using: .tcp
        )
        
        return await withCheckedContinuation { continuation in
            connection.stateUpdateHandler = { state in
                switch state {
                case .ready:
                    DispatchQueue.main.async {
                        self.connectedConnections[address] = connection
                    }
                    continuation.resume(returning: true)
                    
                case .failed(let error):
                    print("Local connection failed: \(error)")
                    continuation.resume(returning: false)
                    
                case .cancelled:
                    continuation.resume(returning: false)
                    
                default:
                    break
                }
            }
            
            connection.start(queue: queue)
        }
    }
    
    private func sendCommandViaLocal(_ command: VibrationCommand, connection: NWConnection) {
        do {
            let data = try JSONEncoder().encode(command)
            let message = NetworkMessage(
                type: .vibrationCommand,
                senderId: "controller",
                receiverId: command.targetDeviceId,
                payload: data,
                timestamp: Date()
            )
            
            let messageData = try JSONEncoder().encode(message)
            
            connection.send(content: messageData, completion: .contentProcessed { error in
                if let error = error {
                    print("Failed to send local command: \(error)")
                }
            })
            
        } catch {
            print("Failed to encode command: \(error)")
        }
    }
    
    // MARK: - Online/WebSocket Methods
    
    private func connectOnline(to deviceId: String) async -> Bool {
        // In a real app, this would connect to your server
        let url = URL(string: "wss://api.vibme.com/connect/\(deviceId)")!
        let webSocketTask = URLSession.shared.webSocketTask(with: url)
        
        return await withCheckedContinuation { continuation in
            webSocketTask.resume()
            
            // Simulate connection success after delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                self.webSocketConnections[deviceId] = webSocketTask
                self.startReceivingMessages(webSocketTask)
                continuation.resume(returning: true)
            }
        }
    }
    
    private func sendCommandViaWebSocket(_ command: VibrationCommand, webSocket: URLSessionWebSocketTask) {
        do {
            let data = try JSONEncoder().encode(command)
            let message = NetworkMessage(
                type: .vibrationCommand,
                senderId: "controller",
                receiverId: command.targetDeviceId,
                payload: data,
                timestamp: Date()
            )
            
            let messageData = try JSONEncoder().encode(message)
            let webSocketMessage = URLSessionWebSocketTask.Message.data(messageData)
            
            webSocket.send(webSocketMessage) { error in
                if let error = error {
                    print("Failed to send WebSocket command: \(error)")
                }
            }
            
        } catch {
            print("Failed to encode WebSocket command: \(error)")
        }
    }
    
    private func startReceivingMessages(_ webSocket: URLSessionWebSocketTask) {
        webSocket.receive { [weak self] result in
            switch result {
            case .success(let message):
                self?.handleWebSocketMessage(message, from: webSocket)
                // Continue receiving messages
                self?.startReceivingMessages(webSocket)
                
            case .failure(let error):
                print("WebSocket receive error: \(error)")
            }
        }
    }
    
    private func handleWebSocketMessage(_ message: URLSessionWebSocketTask.Message, from webSocket: URLSessionWebSocketTask) {
        do {
            let data: Data
            
            switch message {
            case .data(let messageData):
                data = messageData
            case .string(let messageString):
                data = messageString.data(using: .utf8) ?? Data()
            @unknown default:
                return
            }
            
            let networkMessage = try JSONDecoder().decode(NetworkMessage.self, from: data)
            await handleNetworkMessage(networkMessage)
            
        } catch {
            print("Failed to decode WebSocket message: \(error)")
        }
    }
    
    // MARK: - Message Handling
    
    private func handleNetworkMessage(_ message: NetworkMessage) async {
        switch message.type {
        case .statusUpdate:
            // Handle device status updates
            break
            
        case .temperatureAlert:
            // Handle temperature alerts from remote devices
            if let temperatureData = try? JSONDecoder().decode([String: Double].self, from: message.payload),
               let temperature = temperatureData["temperature"] {
                
                NotificationCenter.default.post(
                    name: .temperatureUpdated,
                    object: nil,
                    userInfo: [
                        "deviceId": message.senderId,
                        "temperature": temperature
                    ]
                )
            }
            
        case .deviceDiscovery:
            // Handle device discovery responses
            break
            
        case .heartbeat:
            // Handle heartbeat messages
            break
            
        case .vibrationCommand, .authentication:
            // These are typically sent, not received by controller
            break
        }
    }
    
    // MARK: - Network Monitoring
    
    private func setupNetworkMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                self?.isOnline = path.status == .satisfied
            }
        }
        monitor.start(queue: queue)
    }
    
    // MARK: - Server/Listener
    
    private func startListening() {
        do {
            listener = try NWListener(using: .tcp, on: vibmePort)
            
            listener?.newConnectionHandler = { [weak self] connection in
                self?.handleNewConnection(connection)
            }
            
            listener?.start(queue: queue)
            
        } catch {
            print("Failed to start network listener: \(error)")
        }
    }
    
    private func stopListening() {
        listener?.cancel()
        listener = nil
    }
    
    private func handleNewConnection(_ connection: NWConnection) {
        connection.stateUpdateHandler = { state in
            switch state {
            case .ready:
                print("New connection established")
                self.startReceiving(on: connection)
                
            case .failed(let error):
                print("Connection failed: \(error)")
                
            case .cancelled:
                print("Connection cancelled")
                
            default:
                break
            }
        }
        
        connection.start(queue: queue)
    }
    
    private func startReceiving(on connection: NWConnection) {
        connection.receive(minimumIncompleteLength: 1, maximumLength: 65536) { data, _, isComplete, error in
            if let data = data, !data.isEmpty {
                self.handleReceivedData(data, from: connection)
            }
            
            if !isComplete {
                self.startReceiving(on: connection)
            }
        }
    }
    
    private func handleReceivedData(_ data: Data, from connection: NWConnection) {
        do {
            let message = try JSONDecoder().decode(NetworkMessage.self, from: data)
            Task {
                await self.handleNetworkMessage(message)
            }
        } catch {
            print("Failed to decode received message: \(error)")
        }
    }
}

// MARK: - Supporting Types

struct NetworkDevice: Identifiable {
    let id = UUID()
    let name: String
    let ipAddress: String
    let port: Int
    let deviceType: DeviceType
}