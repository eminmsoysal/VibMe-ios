import Foundation
import Combine

@MainActor
class DeviceManager: ObservableObject {
    @Published var devices: [VibrationDevice] = []
    @Published var isScanning = false
    @Published var errorMessage: String?
    
    weak var bluetoothManager: BluetoothManager?
    weak var networkManager: NetworkManager?
    weak var temperatureMonitor: TemperatureMonitor?
    
    private let devicesKey = "VibMe_Devices"
    private var deviceUpdateTimer: Timer?
    
    init() {
        loadSavedDevices()
        startDeviceUpdateTimer()
    }
    
    deinit {
        deviceUpdateTimer?.invalidate()
    }
    
    // MARK: - Device Management
    
    func addDevice(_ device: VibrationDevice) {
        if !devices.contains(where: { $0.id == device.id }) {
            devices.append(device)
            saveDevices()
        }
    }
    
    func removeDevice(_ device: VibrationDevice) {
        devices.removeAll { $0.id == device.id }
        saveDevices()
    }
    
    func updateDevice(_ device: VibrationDevice) {
        if let index = devices.firstIndex(where: { $0.id == device.id }) {
            devices[index] = device
            saveDevices()
        }
    }
    
    func clearAllDevices() {
        devices.removeAll()
        saveDevices()
    }
    
    // MARK: - Device Discovery
    
    func startScanning() {
        isScanning = true
        errorMessage = nil
        
        // Scan for Bluetooth devices
        bluetoothManager?.startScanning()
        
        // Scan for network devices
        networkManager?.discoverDevices()
        
        // Add some sample devices for demonstration
        addSampleDevices()
        
        // Stop scanning after 10 seconds
        DispatchQueue.main.asyncAfter(deadline: .now() + 10) {
            self.stopScanning()
        }
    }
    
    func stopScanning() {
        isScanning = false
        bluetoothManager?.stopScanning()
    }
    
    private func addSampleDevices() {
        // Add current device as a controller
        let currentDevice = VibrationDevice(
            name: "My iPhone",
            type: .iOSPhone,
            role: .controller,
            connectionType: .local
        )
        var updatedDevice = currentDevice
        updatedDevice.status = .connected
        addDevice(updatedDevice)
        
        // Add some sample target devices
        let sampleDevices = [
            VibrationDevice(
                name: "Partner's iPhone",
                type: .iOSPhone,
                role: .target,
                connectionType: .bluetooth
            ),
            VibrationDevice(
                name: "Smart Watch",
                type: .smartWatch,
                role: .target,
                connectionType: .bluetooth
            )
        ]
        
        for device in sampleDevices {
            addDevice(device)
        }
    }
    
    // MARK: - Connection Management
    
    func connectToDevice(_ device: VibrationDevice) async {
        guard let index = devices.firstIndex(where: { $0.id == device.id }) else { return }
        
        devices[index].status = .connecting
        
        // Simulate connection process
        try? await Task.sleep(nanoseconds: 2_000_000_000) // 2 seconds
        
        switch device.connectionType {
        case .bluetooth:
            let success = await bluetoothManager?.connect(to: device.bluetoothIdentifier ?? "") ?? false
            devices[index].status = success ? .connected : .error
            
        case .online:
            let success = await networkManager?.connect(to: device.ipAddress ?? "") ?? false
            devices[index].status = success ? .connected : .error
            
        case .local:
            devices[index].status = .connected
        }
        
        saveDevices()
    }
    
    func disconnectDevice(_ device: VibrationDevice) {
        guard let index = devices.firstIndex(where: { $0.id == device.id }) else { return }
        
        switch device.connectionType {
        case .bluetooth:
            bluetoothManager?.disconnect(from: device.bluetoothIdentifier ?? "")
        case .online:
            networkManager?.disconnect(from: device.ipAddress ?? "")
        case .local:
            break // Local devices are always "connected"
        }
        
        devices[index].status = .disconnected
        saveDevices()
    }
    
    // MARK: - Vibration Commands
    
    func sendVibrationCommand(to deviceId: String, settings: VibrationSettings) {
        guard let device = devices.first(where: { $0.id.uuidString == deviceId }),
              device.status == .connected else {
            errorMessage = "Device not connected"
            return
        }
        
        let command = VibrationCommand(settings: settings, targetDeviceId: deviceId)
        
        switch device.connectionType {
        case .bluetooth:
            bluetoothManager?.sendVibrationCommand(command)
        case .online:
            networkManager?.sendVibrationCommand(command)
        case .local:
            // For local device, trigger haptic feedback
            triggerLocalVibration(settings)
        }
    }
    
    func sendEmergencyStop(to deviceId: String) {
        guard let device = devices.first(where: { $0.id.uuidString == deviceId }) else { return }
        
        let stopCommand = VibrationCommand.emergencyStop(for: deviceId)
        
        switch device.connectionType {
        case .bluetooth:
            bluetoothManager?.sendVibrationCommand(stopCommand)
        case .online:
            networkManager?.sendVibrationCommand(stopCommand)
        case .local:
            // Stop local vibration immediately
            break
        }
    }
    
    private func triggerLocalVibration(_ settings: VibrationSettings) {
        // This would trigger the local device's haptic feedback
        // For now, we'll just simulate it
        print("Triggering local vibration: \(settings.pattern.rawValue) at \(settings.intensity * 100)% intensity")
    }
    
    // MARK: - Data Persistence
    
    func loadSavedDevices() {
        guard let data = UserDefaults.standard.data(forKey: devicesKey) else { return }
        
        do {
            devices = try JSONDecoder().decode([VibrationDevice].self, from: data)
        } catch {
            print("Failed to load devices: \(error)")
        }
    }
    
    private func saveDevices() {
        do {
            let data = try JSONEncoder().encode(devices)
            UserDefaults.standard.set(data, forKey: devicesKey)
        } catch {
            print("Failed to save devices: \(error)")
        }
    }
    
    // MARK: - Device Status Updates
    
    private func startDeviceUpdateTimer() {
        deviceUpdateTimer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { _ in
            Task {
                await self.updateDeviceStatuses()
            }
        }
    }
    
    private func updateDeviceStatuses() async {
        for i in devices.indices {
            let device = devices[i]
            
            if device.status == .connected {
                // Update temperature
                devices[i].temperature = await temperatureMonitor?.getTemperature(for: device.id.uuidString) ?? device.temperature
                
                // Update last seen
                devices[i].lastSeen = Date()
                
                // Simulate battery level updates for mobile devices
                if device.type == .iOSPhone || device.type == .androidPhone || device.type == .smartWatch {
                    devices[i].batteryLevel = Double.random(in: 20...100)
                }
            }
        }
    }
}