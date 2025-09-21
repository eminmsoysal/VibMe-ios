import SwiftUI

@main
struct VibMeApp: App {
    @StateObject private var authManager = AuthenticationManager()
    @StateObject private var deviceManager = DeviceManager()
    @StateObject private var bluetoothManager = BluetoothManager()
    @StateObject private var temperatureMonitor = TemperatureMonitor()
    @StateObject private var vibrationController = VibrationController()
    @StateObject private var networkManager = NetworkManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .environmentObject(deviceManager)
                .environmentObject(bluetoothManager)
                .environmentObject(temperatureMonitor)
                .environmentObject(vibrationController)
                .environmentObject(networkManager)
                .onAppear {
                    setupApp()
                }
        }
    }
    
    private func setupApp() {
        // Initialize managers and connect them
        deviceManager.bluetoothManager = bluetoothManager
        deviceManager.networkManager = networkManager
        deviceManager.temperatureMonitor = temperatureMonitor
        
        vibrationController.deviceManager = deviceManager
        
        // Start monitoring
        temperatureMonitor.startMonitoring()
        
        // Load saved devices and settings
        deviceManager.loadSavedDevices()
    }
}