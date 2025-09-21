import SwiftUI

struct ControllerView: View {
    @EnvironmentObject var deviceManager: DeviceManager
    @EnvironmentObject var vibrationController: VibrationController
    @EnvironmentObject var temperatureMonitor: TemperatureMonitor
    
    @State private var selectedDevice: VibrationDevice?
    @State private var vibrationSettings = VibrationSettings()
    @State private var showEmergencyStop = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // Device selection
                DeviceSelectionView(selectedDevice: $selectedDevice)
                
                if let device = selectedDevice {
                    ScrollView {
                        VStack(spacing: 24) {
                            // Temperature monitoring
                            TemperatureStatusView(device: device)
                            
                            // Vibration controls
                            VibrationControlsView(
                                settings: $vibrationSettings,
                                isVibrating: vibrationController.isVibrating
                            )
                            
                            // Action buttons
                            VibrationActionButtonsView(
                                device: device,
                                settings: vibrationSettings,
                                showEmergencyStop: $showEmergencyStop
                            )
                        }
                        .padding()
                    }
                } else {
                    // No device selected
                    VStack(spacing: 16) {
                        Image(systemName: "gamecontroller")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        
                        Text("Select a Device")
                            .font(.title2)
                            .fontWeight(.semibold)
                            .foregroundColor(.gray)
                        
                        Text("Choose a connected device to start controlling vibrations")
                            .font(.body)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 32)
                    }
                    .frame(maxHeight: .infinity)
                }
                
                Spacer()
            }
            .navigationTitle("Controller")
            .alert("Emergency Stop", isPresented: $showEmergencyStop) {
                Button("Stop All", role: .destructive) {
                    vibrationController.emergencyStopAll()
                }
                Button("Cancel", role: .cancel) { }
            } message: {
                Text("This will immediately stop all vibrations on all connected devices.")
            }
        }
    }
}

struct DeviceSelectionView: View {
    @Binding var selectedDevice: VibrationDevice?
    @EnvironmentObject var deviceManager: DeviceManager
    
    private var targetDevices: [VibrationDevice] {
        deviceManager.devices.filter { $0.role == .target && $0.status == .connected }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Target Device")
                .font(.headline)
                .padding(.horizontal)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(targetDevices) { device in
                        DeviceSelectionCard(
                            device: device,
                            isSelected: selectedDevice?.id == device.id
                        )
                        .onTapGesture {
                            selectedDevice = device
                        }
                    }
                }
                .padding(.horizontal)
            }
            
            if targetDevices.isEmpty {
                Text("No target devices connected")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.horizontal)
            }
        }
    }
}

struct DeviceSelectionCard: View {
    let device: VibrationDevice
    let isSelected: Bool
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: device.type.icon)
                .font(.title2)
                .foregroundColor(isSelected ? .white : .blue)
            
            Text(device.name)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(isSelected ? .white : .primary)
                .multilineTextAlignment(.center)
                .lineLimit(2)
        }
        .frame(width: 80, height: 80)
        .background(isSelected ? Color.blue : Color(.systemGray6))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
        )
    }
}

struct TemperatureStatusView: View {
    let device: VibrationDevice
    @EnvironmentObject var temperatureMonitor: TemperatureMonitor
    
    private var latestReading: TemperatureReading? {
        temperatureMonitor.getLatestReading(for: device.id.uuidString)
    }
    
    private var temperature: Double {
        latestReading?.temperature ?? device.temperature
    }
    
    private var severity: TemperatureSeverity {
        latestReading?.severity ?? .normal
    }
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: "thermometer")
                    .foregroundColor(Color(severity.color))
                
                Text("Device Temperature")
                    .font(.headline)
                
                Spacer()
                
                Text("\(temperature, specifier: "%.1f")°C")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(Color(severity.color))
            }
            
            ProgressView(value: min(temperature / 50.0, 1.0))
                .tint(Color(severity.color))
                .background(Color.gray.opacity(0.3))
            
            HStack {
                Text("Status: \(severity.rawValue)")
                    .font(.caption)
                    .foregroundColor(Color(severity.color))
                
                Spacer()
                
                if severity != .normal {
                    Text("⚠️ Monitor closely")
                        .font(.caption)
                        .foregroundColor(.orange)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct VibrationControlsView: View {
    @Binding var settings: VibrationSettings
    let isVibrating: Bool
    
    var body: some View {
        VStack(spacing: 20) {
            // Pattern selection
            VStack(alignment: .leading, spacing: 8) {
                Text("Vibration Pattern")
                    .font(.headline)
                
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                    ForEach(VibrationPattern.allCases, id: \.self) { pattern in
                        PatternSelectionButton(
                            pattern: pattern,
                            isSelected: settings.pattern == pattern
                        ) {
                            settings.pattern = pattern
                        }
                    }
                }
            }
            
            // Intensity control
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Intensity")
                        .font(.headline)
                    
                    Spacer()
                    
                    Text("\(Int(settings.intensity * 100))%")
                        .font(.headline)
                        .foregroundColor(.blue)
                }
                
                Slider(value: $settings.intensity, in: 0.0...1.0, step: 0.1)
                    .tint(.blue)
                    .disabled(isVibrating)
                
                HStack {
                    Text("Gentle")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    Text("Intense")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Duration control
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Duration")
                        .font(.headline)
                    
                    Spacer()
                    
                    Text("\(settings.duration, specifier: "%.1f")s")
                        .font(.headline)
                        .foregroundColor(.blue)
                }
                
                Slider(value: $settings.duration, in: 0.1...10.0, step: 0.1)
                    .tint(.blue)
                    .disabled(isVibrating)
                
                HStack {
                    Text("0.1s")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    Text("10s")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Repeating toggle
            HStack {
                Text("Repeat Pattern")
                    .font(.headline)
                
                Spacer()
                
                Toggle("", isOn: $settings.isRepeating)
                    .disabled(isVibrating)
            }
            
            if settings.isRepeating {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("Interval Between Patterns")
                            .font(.subheadline)
                        
                        Spacer()
                        
                        Text("\(settings.intervalBetweenPatterns, specifier: "%.1f")s")
                            .font(.subheadline)
                            .foregroundColor(.blue)
                    }
                    
                    Slider(value: $settings.intervalBetweenPatterns, in: 0.1...5.0, step: 0.1)
                        .tint(.blue)
                        .disabled(isVibrating)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct PatternSelectionButton: View {
    let pattern: VibrationPattern
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Text(pattern.rawValue)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(isSelected ? .white : .primary)
                
                Text(pattern.description)
                    .font(.caption2)
                    .foregroundColor(isSelected ? .white.opacity(0.8) : .secondary)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity, minHeight: 60)
            .padding(8)
            .background(isSelected ? Color.blue : Color(.systemGray5))
            .cornerRadius(8)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct VibrationActionButtonsView: View {
    let device: VibrationDevice
    let settings: VibrationSettings
    @Binding var showEmergencyStop: Bool
    
    @EnvironmentObject var vibrationController: VibrationController
    
    var body: some View {
        VStack(spacing: 16) {
            // Main control buttons
            HStack(spacing: 16) {
                // Start/Stop vibration
                if vibrationController.isVibrating {
                    Button {
                        vibrationController.stopVibration()
                    } label: {
                        HStack {
                            Image(systemName: "stop.fill")
                            Text("Stop")
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(Color.red)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                } else {
                    Button {
                        vibrationController.startVibration(
                            settings: settings,
                            targetDeviceId: device.id.uuidString
                        )
                    } label: {
                        HStack {
                            Image(systemName: "play.fill")
                            Text("Start Vibration")
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                }
                
                // Test vibration
                Button {
                    vibrationController.testVibration(
                        pattern: settings.pattern,
                        intensity: settings.intensity
                    )
                } label: {
                    HStack {
                        Image(systemName: "waveform")
                        Text("Test")
                    }
                    .frame(width: 100)
                    .frame(height: 50)
                    .background(Color.orange)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
            }
            
            // Emergency stop
            Button {
                showEmergencyStop = true
            } label: {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                    Text("Emergency Stop All")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 44)
                .background(Color.red.opacity(0.1))
                .foregroundColor(.red)
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.red, lineWidth: 1)
                )
            }
        }
    }
}

#Preview {
    ControllerView()
        .environmentObject(DeviceManager())
        .environmentObject(VibrationController())
        .environmentObject(TemperatureMonitor())
}