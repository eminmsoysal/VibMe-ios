import Foundation
import CoreBluetooth
import Combine

@MainActor
class BluetoothManager: NSObject, ObservableObject {
    @Published var isBluetoothEnabled = false
    @Published var discoveredDevices: [CBPeripheral] = []
    @Published var connectedPeripherals: [CBPeripheral] = []
    @Published var isScanning = false
    
    private var centralManager: CBCentralManager!
    private var peripherals: [String: CBPeripheral] = [:]
    private var characteristics: [String: CBCharacteristic] = [:]
    
    // Service and characteristic UUIDs for VibMe protocol
    private let vibmeServiceUUID = CBUUID(string: "12345678-1234-1234-1234-123456789ABC")
    private let vibrationCharacteristicUUID = CBUUID(string: "12345678-1234-1234-1234-123456789ABD")
    private let temperatureCharacteristicUUID = CBUUID(string: "12345678-1234-1234-1234-123456789ABE")
    
    override init() {
        super.init()
        centralManager = CBCentralManager(delegate: self, queue: nil)
    }
    
    // MARK: - Public Methods
    
    func startScanning() {
        guard centralManager.state == .poweredOn else {
            print("Bluetooth is not powered on")
            return
        }
        
        isScanning = true
        discoveredDevices.removeAll()
        
        // Scan for devices with VibMe service
        centralManager.scanForPeripherals(
            withServices: [vibmeServiceUUID],
            options: [CBCentralManagerScanOptionAllowDuplicatesKey: false]
        )
        
        // Also scan for all devices for demo purposes
        centralManager.scanForPeripherals(withServices: nil, options: nil)
    }
    
    func stopScanning() {
        centralManager.stopScan()
        isScanning = false
    }
    
    func connect(to deviceIdentifier: String) async -> Bool {
        guard let peripheral = peripherals[deviceIdentifier] else {
            return false
        }
        
        return await withCheckedContinuation { continuation in
            // Store continuation for later use
            connectContinuations[deviceIdentifier] = continuation
            centralManager.connect(peripheral, options: nil)
        }
    }
    
    func disconnect(from deviceIdentifier: String) {
        guard let peripheral = peripherals[deviceIdentifier] else { return }
        centralManager.cancelPeripheralConnection(peripheral)
    }
    
    func sendVibrationCommand(_ command: VibrationCommand) {
        guard let peripheral = peripherals[command.targetDeviceId],
              let characteristic = characteristics["\(command.targetDeviceId)_vibration"] else {
            print("Device or characteristic not found")
            return
        }
        
        do {
            let data = try JSONEncoder().encode(command)
            peripheral.writeValue(data, for: characteristic, type: .withResponse)
        } catch {
            print("Failed to encode vibration command: \(error)")
        }
    }
    
    // MARK: - Private Properties
    
    private var connectContinuations: [String: CheckedContinuation<Bool, Never>] = [:]
}

// MARK: - CBCentralManagerDelegate

extension BluetoothManager: CBCentralManagerDelegate {
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        DispatchQueue.main.async {
            switch central.state {
            case .poweredOn:
                self.isBluetoothEnabled = true
            case .poweredOff, .unauthorized, .unsupported, .resetting, .unknown:
                self.isBluetoothEnabled = false
                self.stopScanning()
            @unknown default:
                self.isBluetoothEnabled = false
            }
        }
    }
    
    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber) {
        DispatchQueue.main.async {
            // Store peripheral
            self.peripherals[peripheral.identifier.uuidString] = peripheral
            
            // Add to discovered devices if not already present
            if !self.discoveredDevices.contains(where: { $0.identifier == peripheral.identifier }) {
                self.discoveredDevices.append(peripheral)
            }
        }
    }
    
    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        DispatchQueue.main.async {
            self.connectedPeripherals.append(peripheral)
        }
        
        // Set delegate and discover services
        peripheral.delegate = self
        peripheral.discoverServices([vibmeServiceUUID])
        
        // Resume continuation
        if let continuation = connectContinuations[peripheral.identifier.uuidString] {
            connectContinuations.removeValue(forKey: peripheral.identifier.uuidString)
            continuation.resume(returning: true)
        }
    }
    
    func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
        print("Failed to connect to peripheral: \(error?.localizedDescription ?? "Unknown error")")
        
        // Resume continuation with failure
        if let continuation = connectContinuations[peripheral.identifier.uuidString] {
            connectContinuations.removeValue(forKey: peripheral.identifier.uuidString)
            continuation.resume(returning: false)
        }
    }
    
    func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        DispatchQueue.main.async {
            self.connectedPeripherals.removeAll { $0.identifier == peripheral.identifier }
        }
        
        if let error = error {
            print("Peripheral disconnected with error: \(error.localizedDescription)")
        }
    }
}

// MARK: - CBPeripheralDelegate

extension BluetoothManager: CBPeripheralDelegate {
    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        if let error = error {
            print("Error discovering services: \(error.localizedDescription)")
            return
        }
        
        guard let services = peripheral.services else { return }
        
        for service in services {
            if service.uuid == vibmeServiceUUID {
                peripheral.discoverCharacteristics([
                    vibrationCharacteristicUUID,
                    temperatureCharacteristicUUID
                ], for: service)
            }
        }
    }
    
    func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        if let error = error {
            print("Error discovering characteristics: \(error.localizedDescription)")
            return
        }
        
        guard let characteristics = service.characteristics else { return }
        
        for characteristic in characteristics {
            let key = "\(peripheral.identifier.uuidString)_"
            
            switch characteristic.uuid {
            case vibrationCharacteristicUUID:
                self.characteristics[key + "vibration"] = characteristic
                
            case temperatureCharacteristicUUID:
                self.characteristics[key + "temperature"] = characteristic
                // Enable notifications for temperature updates
                peripheral.setNotifyValue(true, for: characteristic)
                
            default:
                break
            }
        }
    }
    
    func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        if let error = error {
            print("Error reading characteristic: \(error.localizedDescription)")
            return
        }
        
        guard let data = characteristic.value else { return }
        
        // Handle temperature updates
        if characteristic.uuid == temperatureCharacteristicUUID {
            if let temperatureString = String(data: data, encoding: .utf8),
               let temperature = Double(temperatureString) {
                // Notify temperature monitor
                NotificationCenter.default.post(
                    name: .temperatureUpdated,
                    object: nil,
                    userInfo: [
                        "deviceId": peripheral.identifier.uuidString,
                        "temperature": temperature
                    ]
                )
            }
        }
    }
    
    func peripheral(_ peripheral: CBPeripheral, didWriteValueFor characteristic: CBCharacteristic, error: Error?) {
        if let error = error {
            print("Error writing to characteristic: \(error.localizedDescription)")
        } else {
            print("Successfully sent vibration command")
        }
    }
}

// MARK: - Notification Extensions

extension Notification.Name {
    static let temperatureUpdated = Notification.Name("temperatureUpdated")
}