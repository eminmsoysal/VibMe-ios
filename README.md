# VibMe - Cross-Platform Vibration Control

A comprehensive cross-platform application for controlling vibration devices, built with **React Native** for mobile apps and **.NET 8** for the backend server. This architecture provides true cross-platform support for both iOS and Android devices with a robust, scalable backend.

## 🏗️ Architecture

### Frontend: React Native Mobile App
- **Cross-platform support**: Single codebase runs on both iOS and Android
- **Modern UI**: Built with React Native and Expo for responsive, native-like experience
- **Real-time communication**: SignalR client for live device status updates
- **Haptic feedback**: Native haptic integration for vibration testing and feedback
- **Offline-first**: Local storage with AsyncStorage for user data and settings

### Backend: .NET 8 Web API + SignalR
- **RESTful API**: Complete CRUD operations for devices, users, and temperature monitoring
- **Real-time hub**: SignalR for instant communication between controllers and target devices
- **In-memory database**: Entity Framework Core with in-memory storage for demo purposes
- **Cross-origin support**: CORS configured for React Native clients
- **Authentication**: BCrypt password hashing with secure user management

## ✨ Features

### Device Management & Connectivity
- **Multi-device support**: iOS phones, Android devices, smartwatches, Windows/macOS computers
- **Dual-role system**: Devices can act as controllers or targets
- **Multiple connection types**: Bluetooth, online (SignalR), and local connections
- **Real-time device discovery**: Automatic scanning and device detection
- **Status monitoring**: Live connection status, battery levels, and device health

### Advanced Vibration Control
- **Six vibration patterns**: Pulse, Wave, Heartbeat, Rhythm, Steady, and Custom
- **Precision intensity control**: 0-100% with real-time slider feedback
- **Configurable duration**: 0.1-10 seconds with repeating pattern support
- **Haptic integration**: Expo Haptics for sophisticated local feedback
- **Pattern preview**: Test vibrations locally before sending to target devices

### Safety & Temperature Monitoring 🌡️
**Real-time temperature monitoring** for all connected devices:
- **Four-tier safety system**: 
  - Normal: < 35°C (Green)
  - Warning: 35-40°C (Yellow)  
  - High: 40-45°C (Orange)
  - Critical: > 45°C (Red)
- **Automatic alerts**: Push notifications for temperature warnings
- **Emergency stop**: Instant stop functionality for all devices
- **Temperature history**: Historical data tracking and trend analysis
- **Safety thresholds**: Configurable limits with visual indicators

### User Experience
- **Modern React Native UI**: Intuitive tabbed navigation with bottom tab bar
- **Real-time updates**: Live device status and temperature monitoring
- **Cross-platform authentication**: Secure login/register with persistent sessions
- **Responsive design**: Optimized for phones and tablets
- **Error handling**: Comprehensive error messages and recovery options

## 📱 Mobile App Structure

```
VibMeApp/
├── src/
│   ├── screens/           # Main app screens
│   │   ├── LoginScreen.js
│   │   ├── DevicesScreen.js
│   │   ├── ControllerScreen.js
│   │   ├── TemperatureScreen.js
│   │   └── SettingsScreen.js
│   ├── context/           # React context providers
│   │   ├── AuthContext.js
│   │   └── DeviceContext.js
│   ├── services/          # API and communication services
│   │   ├── ApiService.js
│   │   ├── AuthService.js
│   │   ├── DeviceService.js
│   │   └── SignalRService.js
│   └── components/        # Reusable UI components
└── App.js                 # Main app component with navigation
```

## 🖥️ Backend API Structure

```
VibMeBackend/
├── Controllers/           # REST API controllers
│   ├── AuthController.cs     # Authentication endpoints
│   ├── DevicesController.cs  # Device management CRUD
│   └── TemperatureController.cs # Temperature monitoring
├── Models/                # Data models and DTOs
│   └── VibMeModels.cs        # Complete data model definitions
├── Data/                  # Entity Framework DbContext
│   └── VibMeDbContext.cs     # Database configuration and seeding
├── Hubs/                  # SignalR real-time hubs
│   └── VibMeHub.cs           # Real-time communication hub
└── Program.cs             # Application startup and configuration
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and npm
- **.NET 8 SDK**
- **Expo CLI** (`npm install -g @expo/cli`)
- **iOS Simulator** (Mac) or **Android Studio** (for Android development)

### Backend Setup (.NET 8 API)
```bash
cd VibMeBackend
dotnet restore
dotnet build
dotnet run
```
The API will be available at `http://localhost:5000`

### Mobile App Setup (React Native)
```bash
cd VibMeApp
npm install
npx expo start
```

Then choose your platform:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator  
- Scan QR code with Expo Go app for physical device testing

### Configuration
Update the API base URL in `VibMeApp/src/services/ApiService.js`:
```javascript
const BASE_URL = 'http://your-backend-url:5000/api';
```

For SignalR, update `VibMeApp/src/services/SignalRService.js`:
```javascript
.withUrl('http://your-backend-url:5000/vibmehub')
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `POST /api/auth/logout/{userId}` - User logout
- `GET /api/auth/user/{userId}` - Get user profile

### Device Management
- `GET /api/devices/user/{userId}` - Get user devices
- `POST /api/devices` - Create new device
- `PUT /api/devices/{id}` - Update device
- `DELETE /api/devices/{id}` - Remove device
- `POST /api/devices/{id}/connect` - Connect device
- `POST /api/devices/{id}/disconnect` - Disconnect device

### Temperature Monitoring
- `GET /api/temperature/device/{deviceId}` - Get temperature history
- `GET /api/temperature/device/{deviceId}/latest` - Get latest reading
- `POST /api/temperature` - Record temperature reading
- `GET /api/temperature/alerts/user/{userId}` - Get temperature alerts
- `GET /api/temperature/stats/device/{deviceId}` - Get temperature statistics

### Real-time SignalR Hub (`/vibmehub`)
- `JoinUserGroup(userId)` - Join user notification group
- `JoinDeviceGroup(deviceId)` - Join device-specific group  
- `SendVibrationCommand(command)` - Send vibration to target device
- `SendEmergencyStop(deviceId, senderId)` - Emergency stop command
- `UpdateDeviceStatus(deviceId, status, temp, battery)` - Update device status
- `DiscoverDevices()` - Scan for nearby devices

## 🛡️ Safety Features

- **Temperature monitoring** with four severity levels
- **Automatic vibration cessation** when temperature exceeds safe limits
- **Emergency stop** accessible from any screen in the app
- **Real-time alerts** for temperature warnings and critical conditions
- **Historical tracking** of temperature readings and device health
- **Visual indicators** showing device safety status at all times

## 🔄 Real-time Communication

The app uses SignalR for instant bidirectional communication:
- **Device status updates** pushed to all connected controllers
- **Temperature alerts** sent immediately when thresholds are exceeded
- **Emergency stop commands** broadcast to all target devices instantly
- **Device discovery** results shared in real-time
- **Connection status** monitoring with automatic reconnection

## 📱 Cross-Platform Benefits

### React Native Advantages:
- **Single codebase** for iOS and Android
- **Native performance** with JavaScript flexibility
- **Expo ecosystem** for easy development and testing
- **Hot reload** for rapid development iterations
- **Native module access** for haptics, sensors, and device APIs

### .NET 8 Backend Advantages:
- **High performance** with minimal resource usage
- **Cross-platform deployment** (Windows, Linux, macOS)
- **Strong typing** and compile-time error checking
- **Rich ecosystem** with NuGet packages
- **Built-in dependency injection** and logging
- **Entity Framework Core** for robust data access

## 🔮 Future Enhancements

- **Bluetooth Low Energy**: Direct device-to-device communication
- **Cloud deployment**: Azure/AWS hosting for global availability
- **Push notifications**: Native mobile notifications for alerts
- **Advanced patterns**: Custom vibration pattern creator
- **Multi-user sessions**: Shared control rooms and collaborative control
- **Analytics dashboard**: Usage statistics and device health monitoring
- **Wearable integration**: Apple Watch and Android Wear support

## 📄 License

This project demonstrates a modern cross-platform architecture with React Native and .NET 8, showcasing real-time communication, comprehensive safety features, and professional mobile app development practices.

---

**VibMe** - *Connecting devices safely across platforms* 🌐📱