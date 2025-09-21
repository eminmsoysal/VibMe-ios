import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @EnvironmentObject var deviceManager: DeviceManager
    @EnvironmentObject var temperatureMonitor: TemperatureMonitor
    @State private var selectedTab = 0
    
    var body: some View {
        if authManager.isAuthenticated {
            TabView(selection: $selectedTab) {
                // Device List Tab
                DeviceListView()
                    .tabItem {
                        Image(systemName: "iphone")
                        Text("Devices")
                    }
                    .tag(0)
                
                // Controller Tab
                ControllerView()
                    .tabItem {
                        Image(systemName: "gamecontroller")
                        Text("Controller")
                    }
                    .tag(1)
                
                // Temperature Monitor Tab
                TemperatureMonitorView()
                    .tabItem {
                        Image(systemName: "thermometer")
                        Text("Temperature")
                    }
                    .tag(2)
                
                // Settings Tab
                SettingsView()
                    .tabItem {
                        Image(systemName: "gear")
                        Text("Settings")
                    }
                    .tag(3)
            }
            .alert("Temperature Warning", isPresented: $temperatureMonitor.showAlert) {
                Button("OK") { }
                Button("Emergency Stop") {
                    emergencyStopAll()
                }
            } message: {
                Text(temperatureMonitor.alertMessage)
            }
        } else {
            LoginView()
        }
    }
    
    private func emergencyStopAll() {
        for device in deviceManager.devices {
            if device.status == .connected && device.role == .target {
                deviceManager.sendEmergencyStop(to: device.id.uuidString)
            }
        }
    }
}

struct TemperatureMonitorView: View {
    @EnvironmentObject var temperatureMonitor: TemperatureMonitor
    @EnvironmentObject var deviceManager: DeviceManager
    
    var body: some View {
        NavigationView {
            List {
                ForEach(deviceManager.devices.filter { $0.role == .target }) { device in
                    TemperatureCardView(device: device)
                }
            }
            .navigationTitle("Temperature Monitor")
            .refreshable {
                temperatureMonitor.refreshReadings()
            }
        }
    }
}

struct TemperatureCardView: View {
    let device: VibrationDevice
    @EnvironmentObject var temperatureMonitor: TemperatureMonitor
    
    private var temperatureReading: TemperatureReading? {
        temperatureMonitor.readings.first { $0.deviceId == device.id.uuidString }
    }
    
    private var temperature: Double {
        temperatureReading?.temperature ?? device.temperature
    }
    
    private var severity: TemperatureSeverity {
        temperatureReading?.severity ?? .normal
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: device.type.icon)
                    .foregroundColor(.primary)
                
                VStack(alignment: .leading) {
                    Text(device.name)
                        .font(.headline)
                    Text(device.type.rawValue)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Text("\(temperature, specifier: "%.1f")°C")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(Color(severity.color))
                    
                    Text(severity.rawValue)
                        .font(.caption)
                        .foregroundColor(Color(severity.color))
                }
            }
            
            // Temperature gauge
            ProgressView(value: min(temperature / 50.0, 1.0))
                .tint(Color(severity.color))
                .background(Color.gray.opacity(0.3))
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct SettingsView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @EnvironmentObject var deviceManager: DeviceManager
    
    var body: some View {
        NavigationView {
            List {
                Section("Account") {
                    HStack {
                        Text("Username")
                        Spacer()
                        Text(authManager.currentUser?.username ?? "Unknown")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("Email")
                        Spacer()
                        Text(authManager.currentUser?.email ?? "Unknown")
                            .foregroundColor(.secondary)
                    }
                }
                
                Section("Devices") {
                    HStack {
                        Text("Connected Devices")
                        Spacer()
                        Text("\(deviceManager.devices.filter { $0.status == .connected }.count)")
                            .foregroundColor(.secondary)
                    }
                    
                    Button("Clear All Devices") {
                        deviceManager.clearAllDevices()
                    }
                    .foregroundColor(.red)
                }
                
                Section("Safety") {
                    Toggle("Temperature Monitoring", isOn: .constant(true))
                        .disabled(true)
                    
                    HStack {
                        Text("Max Safe Temperature")
                        Spacer()
                        Text("40.0°C")
                            .foregroundColor(.secondary)
                    }
                }
                
                Section {
                    Button("Sign Out") {
                        authManager.signOut()
                    }
                    .foregroundColor(.red)
                }
            }
            .navigationTitle("Settings")
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthenticationManager())
        .environmentObject(DeviceManager())
        .environmentObject(BluetoothManager())
        .environmentObject(TemperatureMonitor())
        .environmentObject(VibrationController())
        .environmentObject(NetworkManager())
}