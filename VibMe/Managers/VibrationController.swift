import Foundation
import UIKit
import CoreHaptics
import Combine

@MainActor
class VibrationController: ObservableObject {
    @Published var isVibrating = false
    @Published var currentSettings: VibrationSettings?
    @Published var supportsCoreHaptics = false
    
    weak var deviceManager: DeviceManager?
    
    private var hapticEngine: CHHapticEngine?
    private var vibrationTimer: Timer?
    private var patternPlayer: CHHapticPatternPlayer?
    
    init() {
        setupHapticEngine()
    }
    
    deinit {
        stopVibration()
        hapticEngine = nil
    }
    
    // MARK: - Public Methods
    
    func startVibration(settings: VibrationSettings, targetDeviceId: String) {
        currentSettings = settings
        
        // Send command to target device
        deviceManager?.sendVibrationCommand(to: targetDeviceId, settings: settings)
        
        // If targeting local device, also trigger local haptics
        if isLocalDevice(targetDeviceId) {
            triggerLocalVibration(settings)
        }
        
        isVibrating = true
        
        // Auto-stop after duration if not repeating
        if !settings.isRepeating {
            DispatchQueue.main.asyncAfter(deadline: .now() + settings.duration) {
                self.stopVibration()
            }
        }
    }
    
    func stopVibration() {
        isVibrating = false
        currentSettings = nil
        
        // Stop timer
        vibrationTimer?.invalidate()
        vibrationTimer = nil
        
        // Stop haptic pattern
        try? patternPlayer?.stop(atTime: CHHapticTimeImmediate)
        patternPlayer = nil
    }
    
    func emergencyStopAll() {
        stopVibration()
        
        // Send emergency stop to all connected devices
        guard let deviceManager = deviceManager else { return }
        
        for device in deviceManager.devices {
            if device.status == .connected && device.role == .target {
                deviceManager.sendEmergencyStop(to: device.id.uuidString)
            }
        }
    }
    
    func testVibration(pattern: VibrationPattern, intensity: Double) {
        let testSettings = VibrationSettings(
            pattern: pattern,
            intensity: intensity,
            duration: 1.0
        )
        
        // Test on local device
        triggerLocalVibration(testSettings)
    }
    
    // MARK: - Private Methods
    
    private func setupHapticEngine() {
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else {
            supportsCoreHaptics = false
            return
        }
        
        do {
            hapticEngine = try CHHapticEngine()
            try hapticEngine?.start()
            supportsCoreHaptics = true
            
            // Handle engine reset
            hapticEngine?.resetHandler = { [weak self] in
                print("Haptic engine reset")
                do {
                    try self?.hapticEngine?.start()
                } catch {
                    print("Failed to restart haptic engine: \(error)")
                }
            }
            
            // Handle engine stop
            hapticEngine?.stoppedHandler = { [weak self] reason in
                print("Haptic engine stopped: \(reason)")
                self?.supportsCoreHaptics = false
            }
            
        } catch {
            print("Failed to create haptic engine: \(error)")
            supportsCoreHaptics = false
        }
    }
    
    private func triggerLocalVibration(_ settings: VibrationSettings) {
        if supportsCoreHaptics {
            triggerCoreHaptics(settings)
        } else {
            triggerLegacyVibration(settings)
        }
    }
    
    private func triggerCoreHaptics(_ settings: VibrationSettings) {
        guard let hapticEngine = hapticEngine else { return }
        
        do {
            let pattern = createHapticPattern(for: settings)
            patternPlayer = try hapticEngine.makePlayer(with: pattern)
            try patternPlayer?.start(atTime: CHHapticTimeImmediate)
            
            // Handle repeating patterns
            if settings.isRepeating {
                scheduleRepeatingPattern(settings)
            }
            
        } catch {
            print("Failed to play haptic pattern: \(error)")
            // Fall back to legacy vibration
            triggerLegacyVibration(settings)
        }
    }
    
    private func triggerLegacyVibration(_ settings: VibrationSettings) {
        // Use AudioServicesPlaySystemSound for older devices
        switch settings.pattern {
        case .pulse:
            AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
        case .wave, .heartbeat, .rhythm:
            // Create pattern using timer
            createTimerBasedPattern(settings)
        case .steady:
            AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
        case .custom:
            AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
        }
    }
    
    private func createHapticPattern(for settings: VibrationSettings) -> CHHapticPattern {
        var events: [CHHapticEvent] = []
        
        let intensity = CHHapticEventParameter(parameterID: .hapticIntensity, value: Float(settings.intensity))
        let sharpness = CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.5)
        
        switch settings.pattern {
        case .pulse:
            // Quick pulses
            let pulseCount = Int(settings.duration * 4) // 4 pulses per second
            for i in 0..<pulseCount {
                let time = Double(i) * 0.25
                let event = CHHapticEvent(
                    eventType: .hapticTransient,
                    parameters: [intensity, sharpness],
                    relativeTime: time
                )
                events.append(event)
            }
            
        case .wave:
            // Continuous wave with varying intensity
            let duration = CHHapticEventParameter(parameterID: .hapticIntensity, value: Float(settings.duration))
            let event = CHHapticEvent(
                eventType: .hapticContinuous,
                parameters: [intensity, sharpness, duration],
                relativeTime: 0,
                duration: settings.duration
            )
            events.append(event)
            
        case .heartbeat:
            // Two quick beats followed by pause
            let beatPairs = Int(settings.duration / 1.2) // ~50 BPM
            for i in 0..<beatPairs {
                let baseTime = Double(i) * 1.2
                
                // First beat
                let beat1 = CHHapticEvent(
                    eventType: .hapticTransient,
                    parameters: [intensity, sharpness],
                    relativeTime: baseTime
                )
                events.append(beat1)
                
                // Second beat
                let beat2 = CHHapticEvent(
                    eventType: .hapticTransient,
                    parameters: [intensity, sharpness],
                    relativeTime: baseTime + 0.15
                )
                events.append(beat2)
            }
            
        case .rhythm:
            // Musical rhythm pattern
            let pattern = [0.0, 0.25, 0.75, 1.0, 1.25]
            let cycleLength = 1.5
            let cycles = Int(settings.duration / cycleLength)
            
            for cycle in 0..<cycles {
                for beat in pattern {
                    let time = Double(cycle) * cycleLength + beat
                    let event = CHHapticEvent(
                        eventType: .hapticTransient,
                        parameters: [intensity, sharpness],
                        relativeTime: time
                    )
                    events.append(event)
                }
            }
            
        case .steady:
            // Continuous vibration
            let duration = CHHapticEventParameter(parameterID: .hapticIntensity, value: Float(settings.duration))
            let event = CHHapticEvent(
                eventType: .hapticContinuous,
                parameters: [intensity, sharpness, duration],
                relativeTime: 0,
                duration: settings.duration
            )
            events.append(event)
            
        case .custom:
            // Default to pulse for custom patterns
            let event = CHHapticEvent(
                eventType: .hapticTransient,
                parameters: [intensity, sharpness],
                relativeTime: 0
            )
            events.append(event)
        }
        
        do {
            return try CHHapticPattern(events: events, parameters: [])
        } catch {
            print("Failed to create haptic pattern: \(error)")
            // Return simple pattern as fallback
            let event = CHHapticEvent(
                eventType: .hapticTransient,
                parameters: [intensity, sharpness],
                relativeTime: 0
            )
            return try! CHHapticPattern(events: [event], parameters: [])
        }
    }
    
    private func createTimerBasedPattern(_ settings: VibrationSettings) {
        vibrationTimer?.invalidate()
        
        let interval: TimeInterval
        let vibrationLength: TimeInterval = 0.1
        
        switch settings.pattern {
        case .pulse:
            interval = 0.25
        case .heartbeat:
            interval = 0.6
        case .rhythm:
            interval = 0.3
        default:
            interval = 0.5
        }
        
        var elapsed: TimeInterval = 0
        
        vibrationTimer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { timer in
            if elapsed >= settings.duration {
                timer.invalidate()
                return
            }
            
            AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
            elapsed += interval
        }
    }
    
    private func scheduleRepeatingPattern(_ settings: VibrationSettings) {
        let totalCycleTime = settings.duration + settings.intervalBetweenPatterns
        
        vibrationTimer = Timer.scheduledTimer(withTimeInterval: totalCycleTime, repeats: true) { [weak self] _ in
            guard let self = self, self.isVibrating else { return }
            
            do {
                try self.patternPlayer?.start(atTime: CHHapticTimeImmediate)
            } catch {
                print("Failed to restart haptic pattern: \(error)")
            }
        }
    }
    
    private func isLocalDevice(_ deviceId: String) -> Bool {
        guard let deviceManager = deviceManager else { return false }
        
        return deviceManager.devices.first { device in
            device.id.uuidString == deviceId && device.connectionType == .local
        } != nil
    }
}

// MARK: - AudioServices Import

import AudioToolbox