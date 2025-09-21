import SwiftUI
import CoreBluetooth

struct DeviceListView: View {
    @EnvironmentObject var deviceManager: DeviceManager
    @EnvironmentObject var bluetoothManager: BluetoothManager
    @State private var showingAddDevice = false
    @State private var selectedDevice: VibrationDevice?
    
    var body: some View {
        NavigationView {
            List {
                // Connected devices section
                if !connectedDevices.isEmpty {
                    Section("Connected Devices") {
                        ForEach(connectedDevices) { device in
                            DeviceRowView(device: device)
                                .onTapGesture {
                                    selectedDevice = device
                                }
                        }
                    }
                }
                
                // Available devices section
                if !availableDevices.isEmpty {
                    Section("Available Devices") {
                        ForEach(availableDevices) { device in
                            DeviceRowView(device: device)
                                .onTapGesture {
                                    selectedDevice = device
                                }
                        }
                        .onDelete(perform: deleteDevices)
                    }
                }
                
                // Discovered Bluetooth devices
                if !bluetoothManager.discoveredDevices.isEmpty {
                    Section("Discovered Bluetooth Devices") {
                        ForEach(bluetoothManager.discoveredDevices, id: \.identifier) { peripheral in
                            BluetoothDeviceRowView(peripheral: peripheral)
                        }
                    }
                }
                
                // Empty state
                if deviceManager.devices.isEmpty && !deviceManager.isScanning {
                    Section {
                        VStack(spacing: 16) {
                            Image(systemName: "iphone.slash")
                                .font(.largeTitle)
                                .foregroundColor(.gray)
                            
                            Text("No devices found")
                                .font(.headline)
                                .foregroundColor(.gray)
                            
                            Text("Tap the + button to add devices or scan for nearby devices")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                            
                            Button("Start Scanning") {
                                deviceManager.startScanning()
                            }
                            .buttonStyle(.borderedProminent)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 40)
                    }
                }
            }
            .navigationTitle("Devices")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    if deviceManager.isScanning {
                        HStack {
                            ProgressView()
                                .scaleEffect(0.8)
                            Text("Scanning...")
                                .font(.caption)
                        }
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button {
                            deviceManager.startScanning()
                        } label: {
                            Label("Scan for Devices", systemImage: "magnifyingglass")
                        }
                        
                        Button {
                            showingAddDevice = true
                        } label: {
                            Label("Add Device Manually", systemImage: "plus")
                        }
                        
                        Divider()
                        
                        Button {
                            deviceManager.stopScanning()
                        } label: {
                            Label("Stop Scanning", systemImage: "stop")
                        }
                        .disabled(!deviceManager.isScanning)
                        
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .refreshable {
                deviceManager.startScanning()
            }
            .sheet(isPresented: $showingAddDevice) {
                AddDeviceView()
            }
            .sheet(item: $selectedDevice) { device in
                DeviceDetailView(device: device)
            }
        }
    }
    
    private var connectedDevices: [VibrationDevice] {
        deviceManager.devices.filter { $0.status == .connected }
    }
    
    private var availableDevices: [VibrationDevice] {
        deviceManager.devices.filter { $0.status != .connected }
    }
    
    private func deleteDevices(offsets: IndexSet) {
        for index in offsets {
            let device = availableDevices[index]
            deviceManager.removeDevice(device)
        }
    }
}

struct DeviceRowView: View {
    let device: VibrationDevice
    @EnvironmentObject var deviceManager: DeviceManager
    
    var body: some View {
        HStack(spacing: 12) {
            // Device icon
            Image(systemName: device.type.icon)
                .font(.title2)
                .foregroundColor(.blue)
                .frame(width: 32, height: 32)
            
            // Device info
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(device.name)
                        .font(.headline)
                    
                    Spacer()
                    
                    // Status indicator
                    HStack(spacing: 4) {
                        Circle()
                            .fill(Color(device.status.color))
                            .frame(width: 8, height: 8)
                        
                        Text(device.status.rawValue)
                            .font(.caption)
                            .foregroundColor(Color(device.status.color))
                    }
                }
                
                HStack {
                    Text(device.type.rawValue)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text("•")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text(device.role.rawValue)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text("•")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text(device.connectionType.rawValue)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                // Additional info
                HStack {
                    if device.temperature > 35.0 {
                        HStack(spacing: 2) {
                            Image(systemName: "thermometer")
                                .font(.caption)
                            Text("\(device.temperature, specifier: "%.1f")°C")
                                .font(.caption)
                        }
                        .foregroundColor(.orange)
                    }
                    
                    if let batteryLevel = device.batteryLevel {
                        HStack(spacing: 2) {
                            Image(systemName: batteryIcon(level: batteryLevel))
                                .font(.caption)
                            Text("\(Int(batteryLevel))%")
                                .font(.caption)
                        }
                        .foregroundColor(batteryColor(level: batteryLevel))
                    }
                    
                    Spacer()
                    
                    Text(timeAgo(device.lastSeen))
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            
            // Action button
            if device.status == .connected {
                Button {
                    deviceManager.disconnectDevice(device)
                } label: {
                    Text("Disconnect")
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.red.opacity(0.1))
                        .foregroundColor(.red)
                        .cornerRadius(6)
                }
            } else {
                Button {
                    Task {
                        await deviceManager.connectToDevice(device)
                    }
                } label: {
                    Text("Connect")
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.blue.opacity(0.1))
                        .foregroundColor(.blue)
                        .cornerRadius(6)
                }
            }
        }
        .padding(.vertical, 4)
    }
    
    private func batteryIcon(level: Double) -> String {
        switch level {
        case 75...100: return "battery.100"
        case 50..<75: return "battery.75"
        case 25..<50: return "battery.25"
        default: return "battery.0"
        }
    }
    
    private func batteryColor(level: Double) -> Color {
        switch level {
        case 25...100: return .green
        case 10..<25: return .orange
        default: return .red
        }
    }
    
    private func timeAgo(_ date: Date) -> String {
        let interval = Date().timeIntervalSince(date)
        
        if interval < 60 {
            return "now"
        } else if interval < 3600 {
            return "\(Int(interval / 60))m ago"
        } else if interval < 86400 {
            return "\(Int(interval / 3600))h ago"
        } else {
            return "\(Int(interval / 86400))d ago"
        }
    }
}

struct BluetoothDeviceRowView: View {
    let peripheral: CBPeripheral
    @EnvironmentObject var deviceManager: DeviceManager
    
    var body: some View {
        HStack {
            Image(systemName: "dot.radiowaves.left.and.right")
                .foregroundColor(.blue)
            
            VStack(alignment: .leading) {
                Text(peripheral.name ?? "Unknown Device")
                    .font(.headline)
                
                Text(peripheral.identifier.uuidString)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Button("Add") {
                let device = VibrationDevice(
                    name: peripheral.name ?? "Bluetooth Device",
                    type: .iOSPhone, // Default type
                    role: .target,
                    connectionType: .bluetooth
                )
                var newDevice = device
                newDevice.bluetoothIdentifier = peripheral.identifier.uuidString
                deviceManager.addDevice(newDevice)
            }
            .buttonStyle(.bordered)
            .controlSize(.small)
        }
    }
}

#Preview {
    DeviceListView()
        .environmentObject(DeviceManager())
        .environmentObject(BluetoothManager())
}