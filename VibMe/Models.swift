import Foundation

// MARK: - Device Models

enum DeviceType: String, CaseIterable, Codable {
    case iOSPhone = "iOS Phone"
    case androidPhone = "Android Phone"
    case smartWatch = "Smart Watch"
    case windowsPC = "Windows PC"
    case macOS = "macOS"
    
    var icon: String {
        switch self {
        case .iOSPhone: return "iphone"
        case .androidPhone: return "smartphone"
        case .smartWatch: return "applewatch"
        case .windowsPC: return "pc"
        case .macOS: return "macbook"
        }
    }
}

enum DeviceRole: String, CaseIterable, Codable {
    case controller = "Controller"
    case target = "Target"
    
    var description: String {
        switch self {
        case .controller: return "Controller Device"
        case .target: return "Target Device"
        }
    }
}

enum ConnectionType: String, CaseIterable, Codable {
    case bluetooth = "Bluetooth"
    case online = "Online"
    case local = "Local"
}

enum DeviceStatus: String, CaseIterable, Codable {
    case disconnected = "Disconnected"
    case connecting = "Connecting"
    case connected = "Connected"
    case error = "Error"
    
    var color: String {
        switch self {
        case .disconnected: return "gray"
        case .connecting: return "orange"
        case .connected: return "green"
        case .error: return "red"
        }
    }
}

struct VibrationDevice: Identifiable, Codable {
    let id = UUID()
    var name: String
    var type: DeviceType
    var role: DeviceRole
    var connectionType: ConnectionType
    var status: DeviceStatus
    var bluetoothIdentifier: String?
    var ipAddress: String?
    var temperature: Double
    var lastSeen: Date
    var batteryLevel: Double?
    
    init(name: String, type: DeviceType, role: DeviceRole, connectionType: ConnectionType) {
        self.name = name
        self.type = type
        self.role = role
        self.connectionType = connectionType
        self.status = .disconnected
        self.temperature = 20.0 // Default room temperature
        self.lastSeen = Date()
        self.batteryLevel = nil
    }
}

// MARK: - Vibration Models

enum VibrationPattern: String, CaseIterable, Codable {
    case pulse = "Pulse"
    case wave = "Wave"
    case heartbeat = "Heartbeat"
    case rhythm = "Rhythm"
    case steady = "Steady"
    case custom = "Custom"
    
    var description: String {
        switch self {
        case .pulse: return "Quick pulses with pauses"
        case .wave: return "Gradual intensity waves"
        case .heartbeat: return "Rhythmic heartbeat pattern"
        case .rhythm: return "Musical rhythm pattern"
        case .steady: return "Constant vibration"
        case .custom: return "User-defined pattern"
        }
    }
}

struct VibrationSettings: Codable {
    var pattern: VibrationPattern
    var intensity: Double // 0.0 to 1.0
    var duration: TimeInterval // in seconds
    var intervalBetweenPatterns: TimeInterval // in seconds
    var isRepeating: Bool
    
    init(pattern: VibrationPattern = .pulse, intensity: Double = 0.5, duration: TimeInterval = 1.0) {
        self.pattern = pattern
        self.intensity = max(0.0, min(1.0, intensity))
        self.duration = duration
        self.intervalBetweenPatterns = 0.5
        self.isRepeating = false
    }
}

// MARK: - User Models

struct User: Identifiable, Codable {
    let id = UUID()
    var username: String
    var email: String
    var isLoggedIn: Bool
    var deviceSettings: [String: VibrationSettings] // Device ID to settings mapping
    var connectedDevices: [String] // Array of device IDs
    
    init(username: String, email: String) {
        self.username = username
        self.email = email
        self.isLoggedIn = false
        self.deviceSettings = [:]
        self.connectedDevices = []
    }
}

// MARK: - Temperature Models

struct TemperatureReading: Identifiable, Codable {
    let id = UUID()
    let deviceId: String
    let temperature: Double
    let timestamp: Date
    
    var isNormal: Bool {
        return temperature < 40.0 // Below 40°C is considered safe
    }
    
    var severity: TemperatureSeverity {
        switch temperature {
        case ..<35.0:
            return .normal
        case 35.0..<40.0:
            return .warning
        case 40.0..<45.0:
            return .high
        default:
            return .critical
        }
    }
}

enum TemperatureSeverity: String, CaseIterable, Codable {
    case normal = "Normal"
    case warning = "Warning"
    case high = "High"
    case critical = "Critical"
    
    var color: String {
        switch self {
        case .normal: return "green"
        case .warning: return "yellow"
        case .high: return "orange"
        case .critical: return "red"
        }
    }
    
    var maxTemperature: Double {
        switch self {
        case .normal: return 35.0
        case .warning: return 40.0
        case .high: return 45.0
        case .critical: return Double.greatestFiniteMagnitude
        }
    }
}

// MARK: - Network Models

struct NetworkMessage: Codable {
    let id = UUID()
    let type: MessageType
    let senderId: String
    let receiverId: String
    let payload: Data
    let timestamp: Date
    
    enum MessageType: String, Codable {
        case vibrationCommand = "vibration_command"
        case statusUpdate = "status_update"
        case temperatureAlert = "temperature_alert"
        case deviceDiscovery = "device_discovery"
        case authentication = "authentication"
        case heartbeat = "heartbeat"
    }
}

struct VibrationCommand: Codable {
    let settings: VibrationSettings
    let targetDeviceId: String
    let executionTime: Date?
    let isEmergencyStop: Bool
    
    init(settings: VibrationSettings, targetDeviceId: String, executionTime: Date? = nil) {
        self.settings = settings
        self.targetDeviceId = targetDeviceId
        self.executionTime = executionTime
        self.isEmergencyStop = false
    }
    
    static func emergencyStop(for deviceId: String) -> VibrationCommand {
        var stopSettings = VibrationSettings(pattern: .steady, intensity: 0.0, duration: 0.0)
        var command = VibrationCommand(
            settings: stopSettings,
            targetDeviceId: deviceId,
            executionTime: nil
        )
        return VibrationCommand(
            settings: stopSettings,
            targetDeviceId: deviceId,
            executionTime: nil
        )
    }
}