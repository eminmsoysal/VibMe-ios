# VibMe iOS

A cross-platform vibration control application that allows users to connect and control various devices with vibration capabilities through Bluetooth and online connectivity.

## Features

### Device Management
- **Multi-Device Support**: Connect iOS phones, Android devices, smart watches, Windows/macOS computers
- **Dual Role System**: Devices can act as controllers or targets
- **Connection Options**: Bluetooth, online (WebSocket), and local connections
- **Real-time Status**: Monitor connection status, battery levels, and device health

### Vibration Control
- **Multiple Patterns**: Pulse, Wave, Heartbeat, Rhythm, Steady, and Custom patterns
- **Intensity Control**: Adjustable vibration strength from 0-100%
- **Duration Settings**: Configurable vibration duration (0.1-10 seconds)
- **Repeating Patterns**: Option to repeat patterns with customizable intervals
- **Core Haptics Integration**: Advanced haptic feedback on supported devices

### Safety Features
- **Temperature Monitoring**: Continuous monitoring of device temperature
- **Safety Alerts**: Automatic warnings when temperature exceeds safe levels
- **Emergency Stop**: Instant stop functionality for all connected devices
- **Temperature Thresholds**: 
  - Normal: < 35°C
  - Warning: 35-40°C  
  - High: 40-45°C
  - Critical: > 45°C

### Connectivity
- **Bluetooth**: Core Bluetooth integration for local device connections
- **Network**: WebSocket and TCP connections for online control
- **Discovery**: Automatic device discovery via Bluetooth scanning
- **Cross-Platform**: Designed to work with iOS, Android, and desktop devices

### User Interface
- **SwiftUI**: Modern, responsive user interface
- **Tabbed Navigation**: Easy access to Devices, Controller, Temperature, and Settings
- **Real-time Updates**: Live status updates and temperature readings
- **Intuitive Controls**: Simple, user-friendly vibration controls

## Architecture

### Core Components
- **DeviceManager**: Handles device discovery, connection, and management
- **BluetoothManager**: Core Bluetooth functionality for local connections
- **NetworkManager**: WebSocket and TCP networking for online connections
- **VibrationController**: Haptic feedback and vibration pattern generation
- **TemperatureMonitor**: Real-time temperature monitoring and safety alerts
- **AuthenticationManager**: User authentication and session management

### Data Models
- **VibrationDevice**: Device representation with status, type, and connection info
- **VibrationSettings**: Configuration for patterns, intensity, and duration
- **TemperatureReading**: Temperature data with severity classification
- **User**: User profile with device settings and preferences

## Safety & Privacy

### Temperature Safety
- Continuous monitoring prevents device overheating
- Automatic alerts at predefined temperature thresholds
- Emergency stop functionality for immediate safety response
- Historical temperature tracking

### Privacy
- Local data storage with UserDefaults
- No sensitive data transmitted without encryption
- User-controlled device connections
- Optional cloud synchronization

## Technical Requirements

- **iOS 17.0+**
- **Xcode 15.0+**
- **Swift 5.0+**
- **Core Bluetooth** (for local device connections)
- **Core Haptics** (for advanced vibration patterns)
- **Network Framework** (for online connections)

## Usage

1. **Authentication**: Sign in or create an account
2. **Device Discovery**: Scan for nearby devices or add manually
3. **Connection**: Connect to target devices via Bluetooth or online
4. **Control**: Select devices and configure vibration patterns
5. **Monitor**: Keep track of device temperature and status
6. **Safety**: Use emergency stop if needed

## Development Status

This is a complete iOS application implementing all core features for cross-platform vibration control with comprehensive safety measures and an intuitive user interface.