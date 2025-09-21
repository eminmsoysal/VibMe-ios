import Foundation
import Combine

@MainActor
class TemperatureMonitor: ObservableObject {
    @Published var readings: [TemperatureReading] = []
    @Published var showAlert = false
    @Published var alertMessage = ""
    @Published var isMonitoring = false
    
    private var monitoringTimer: Timer?
    private let maxReadings = 100 // Keep last 100 readings per device
    private let temperatureThreshold = 40.0 // Alert above 40°C
    private let criticalTemperature = 45.0 // Critical temperature
    
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        setupNotifications()
    }
    
    deinit {
        stopMonitoring()
    }
    
    // MARK: - Public Methods
    
    func startMonitoring() {
        guard !isMonitoring else { return }
        
        isMonitoring = true
        
        // Start periodic temperature simulation
        monitoringTimer = Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { _ in
            Task {
                await self.simulateTemperatureReadings()
            }
        }
    }
    
    func stopMonitoring() {
        monitoringTimer?.invalidate()
        monitoringTimer = nil
        isMonitoring = false
    }
    
    func getTemperature(for deviceId: String) async -> Double {
        // Return latest temperature reading for device
        return readings.first { $0.deviceId == deviceId }?.temperature ?? 25.0
    }
    
    func refreshReadings() {
        // Trigger immediate temperature check for all devices
        Task {
            await simulateTemperatureReadings()
        }
    }
    
    // MARK: - Private Methods
    
    private func setupNotifications() {
        // Listen for Bluetooth temperature updates
        NotificationCenter.default.publisher(for: .temperatureUpdated)
            .sink { [weak self] notification in
                guard let self = self,
                      let deviceId = notification.userInfo?["deviceId"] as? String,
                      let temperature = notification.userInfo?["temperature"] as? Double else { return }
                
                Task {
                    await self.addTemperatureReading(deviceId: deviceId, temperature: temperature)
                }
            }
            .store(in: &cancellables)
    }
    
    private func simulateTemperatureReadings() async {
        // This simulates temperature readings from connected devices
        // In a real app, this would come from actual device sensors
        
        let sampleDevices = [
            "device1": "My iPhone",
            "device2": "Partner's iPhone", 
            "device3": "Smart Watch"
        ]
        
        for (deviceId, deviceName) in sampleDevices {
            // Simulate temperature variations
            let baseTemp = Double.random(in: 18...42) // Room temperature to slightly warm
            let variation = Double.random(in: -2...2) // Small random variation
            let temperature = baseTemp + variation
            
            await addTemperatureReading(deviceId: deviceId, temperature: temperature)
        }
    }
    
    private func addTemperatureReading(deviceId: String, temperature: Double) async {
        let reading = TemperatureReading(
            deviceId: deviceId,
            temperature: temperature,
            timestamp: Date()
        )
        
        // Add reading
        readings.append(reading)
        
        // Remove old readings to prevent memory issues
        let deviceReadings = readings.filter { $0.deviceId == deviceId }
        if deviceReadings.count > maxReadings {
            readings.removeAll { $0.deviceId == deviceId && $0.id == deviceReadings.first?.id }
        }
        
        // Sort readings by timestamp
        readings.sort { $0.timestamp > $1.timestamp }
        
        // Check for temperature alerts
        await checkTemperatureAlerts(reading)
    }
    
    private func checkTemperatureAlerts(_ reading: TemperatureReading) async {
        let severity = reading.severity
        
        switch severity {
        case .normal:
            break // No action needed
            
        case .warning:
            if !showAlert {
                alertMessage = "Temperature warning: Device reaching \(reading.temperature, specifier: "%.1f")°C. Please monitor closely."
                showAlert = true
            }
            
        case .high:
            alertMessage = "High temperature alert: Device at \(reading.temperature, specifier: "%.1f")°C. Consider stopping vibration."
            showAlert = true
            
        case .critical:
            alertMessage = "CRITICAL: Device temperature at \(reading.temperature, specifier: "%.1f")°C. Emergency stop recommended!"
            showAlert = true
            
            // Send notification for emergency action
            NotificationCenter.default.post(
                name: .criticalTemperatureAlert,
                object: nil,
                userInfo: [
                    "deviceId": reading.deviceId,
                    "temperature": reading.temperature
                ]
            )
        }
    }
    
    // MARK: - Data Access Methods
    
    func getLatestReading(for deviceId: String) -> TemperatureReading? {
        return readings.first { $0.deviceId == deviceId }
    }
    
    func getReadings(for deviceId: String, limit: Int = 10) -> [TemperatureReading] {
        return readings
            .filter { $0.deviceId == deviceId }
            .prefix(limit)
            .map { $0 }
    }
    
    func getDevicesAboveThreshold() -> [String] {
        let latestReadings = Dictionary(grouping: readings) { $0.deviceId }
            .compactMapValues { $0.first }
        
        return latestReadings
            .filter { $0.value.temperature > temperatureThreshold }
            .map { $0.key }
    }
    
    func getAverageTemperature(for deviceId: String, minutes: Int = 5) -> Double {
        let cutoffTime = Date().addingTimeInterval(-TimeInterval(minutes * 60))
        
        let recentReadings = readings.filter {
            $0.deviceId == deviceId && $0.timestamp >= cutoffTime
        }
        
        guard !recentReadings.isEmpty else { return 0.0 }
        
        let sum = recentReadings.reduce(0.0) { $0 + $1.temperature }
        return sum / Double(recentReadings.count)
    }
    
    func getTemperatureTrend(for deviceId: String) -> TemperatureTrend {
        let recent = getReadings(for: deviceId, limit: 5)
        
        guard recent.count >= 3 else { return .stable }
        
        let firstTemp = recent.last?.temperature ?? 0
        let lastTemp = recent.first?.temperature ?? 0
        let difference = lastTemp - firstTemp
        
        if difference > 2.0 {
            return .rising
        } else if difference < -2.0 {
            return .falling
        } else {
            return .stable
        }
    }
}

// MARK: - Helper Types

enum TemperatureTrend {
    case rising, falling, stable
    
    var description: String {
        switch self {
        case .rising: return "Rising"
        case .falling: return "Falling"
        case .stable: return "Stable"
        }
    }
    
    var icon: String {
        switch self {
        case .rising: return "arrow.up"
        case .falling: return "arrow.down"
        case .stable: return "minus"
        }
    }
}

// MARK: - Notification Extensions

extension Notification.Name {
    static let criticalTemperatureAlert = Notification.Name("criticalTemperatureAlert")
}