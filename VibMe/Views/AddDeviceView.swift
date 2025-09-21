import SwiftUI

struct AddDeviceView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var deviceManager: DeviceManager
    
    @State private var deviceName = ""
    @State private var selectedType = DeviceType.iOSPhone
    @State private var selectedRole = DeviceRole.target
    @State private var selectedConnection = ConnectionType.bluetooth
    @State private var ipAddress = ""
    @State private var bluetoothID = ""
    
    var body: some View {
        NavigationView {
            Form {
                Section("Device Information") {
                    TextField("Device Name", text: $deviceName)
                    
                    Picker("Device Type", selection: $selectedType) {
                        ForEach(DeviceType.allCases, id: \.self) { type in
                            HStack {
                                Image(systemName: type.icon)
                                Text(type.rawValue)
                            }
                            .tag(type)
                        }
                    }
                    
                    Picker("Role", selection: $selectedRole) {
                        ForEach(DeviceRole.allCases, id: \.self) { role in
                            Text(role.rawValue).tag(role)
                        }
                    }
                    
                    Picker("Connection Type", selection: $selectedConnection) {
                        ForEach(ConnectionType.allCases, id: \.self) { connection in
                            Text(connection.rawValue).tag(connection)
                        }
                    }
                }
                
                if selectedConnection == .online {
                    Section("Network Settings") {
                        TextField("IP Address", text: $ipAddress)
                            .keyboardType(.decimalPad)
                    }
                }
                
                if selectedConnection == .bluetooth {
                    Section("Bluetooth Settings") {
                        TextField("Bluetooth Identifier (Optional)", text: $bluetoothID)
                    }
                }
                
                Section("Safety Notice") {
                    HStack {
                        Image(systemName: "exclamationmark.triangle")
                            .foregroundColor(.orange)
                        Text("Always ensure device temperature is monitored when using vibration features.")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Add Device")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Add") {
                        addDevice()
                    }
                    .disabled(deviceName.isEmpty || (selectedConnection == .online && ipAddress.isEmpty))
                }
            }
        }
    }
    
    private func addDevice() {
        var device = VibrationDevice(
            name: deviceName,
            type: selectedType,
            role: selectedRole,
            connectionType: selectedConnection
        )
        
        if selectedConnection == .online {
            device.ipAddress = ipAddress
        }
        
        if selectedConnection == .bluetooth && !bluetoothID.isEmpty {
            device.bluetoothIdentifier = bluetoothID
        }
        
        deviceManager.addDevice(device)
        dismiss()
    }
}

struct DeviceDetailView: View {
    let device: VibrationDevice
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var deviceManager: DeviceManager
    @EnvironmentObject var temperatureMonitor: TemperatureMonitor
    
    private var temperatureReadings: [TemperatureReading] {
        temperatureMonitor.getReadings(for: device.id.uuidString, limit: 20)
    }
    
    var body: some View {
        NavigationView {
            List {
                Section("Device Information") {
                    DetailRow(label: "Name", value: device.name)
                    DetailRow(label: "Type", value: device.type.rawValue)
                    DetailRow(label: "Role", value: device.role.rawValue)
                    DetailRow(label: "Connection", value: device.connectionType.rawValue)
                    DetailRow(label: "Status", value: device.status.rawValue)
                }
                
                if device.connectionType == .bluetooth, let bluetoothID = device.bluetoothIdentifier {
                    Section("Bluetooth") {
                        DetailRow(label: "Identifier", value: bluetoothID)
                    }
                }
                
                if device.connectionType == .online, let ipAddress = device.ipAddress {
                    Section("Network") {
                        DetailRow(label: "IP Address", value: ipAddress)
                    }
                }
                
                Section("Status") {
                    HStack {
                        Text("Temperature")
                        Spacer()
                        Text("\(device.temperature, specifier: "%.1f")°C")
                            .foregroundColor(temperatureColor(device.temperature))
                    }
                    
                    if let batteryLevel = device.batteryLevel {
                        HStack {
                            Text("Battery")
                            Spacer()
                            Text("\(Int(batteryLevel))%")
                                .foregroundColor(batteryColor(batteryLevel))
                        }
                    }
                    
                    DetailRow(label: "Last Seen", value: formatDate(device.lastSeen))
                }
                
                if !temperatureReadings.isEmpty {
                    Section("Temperature History") {
                        ForEach(temperatureReadings) { reading in
                            HStack {
                                Text(formatTime(reading.timestamp))
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                
                                Spacer()
                                
                                Text("\(reading.temperature, specifier: "%.1f")°C")
                                    .font(.caption)
                                    .foregroundColor(Color(reading.severity.color))
                            }
                        }
                    }
                }
                
                Section {
                    if device.status == .connected {
                        Button("Disconnect") {
                            deviceManager.disconnectDevice(device)
                        }
                        .foregroundColor(.red)
                    } else {
                        Button("Connect") {
                            Task {
                                await deviceManager.connectToDevice(device)
                            }
                        }
                    }
                    
                    Button("Remove Device") {
                        deviceManager.removeDevice(device)
                        dismiss()
                    }
                    .foregroundColor(.red)
                }
            }
            .navigationTitle(device.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private func temperatureColor(_ temp: Double) -> Color {
        let severity = TemperatureSeverity.allCases.first { temp < $0.maxTemperature } ?? .critical
        return Color(severity.color)
    }
    
    private func batteryColor(_ level: Double) -> Color {
        switch level {
        case 25...100: return .green
        case 10..<25: return .orange
        default: return .red
        }
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
    
    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

struct DetailRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
            Spacer()
            Text(value)
                .foregroundColor(.secondary)
        }
    }
}

#Preview {
    AddDeviceView()
        .environmentObject(DeviceManager())
}