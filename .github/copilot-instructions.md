
# VibMe - Cross-Platform Vibration Control

VibMe is a comprehensive cross-platform application for controlling vibration devices, built with **React Native** (VibMeApp) for mobile clients and **.NET 8** (VibMeBackend) for the backend server. The architecture provides true cross-platform support for both iOS and Android devices with a robust, scalable backend featuring real-time communication via SignalR.

**ALWAYS follow these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively  

### System Requirements and Dependencies
- **Node.js** 18+ (currently using v20.19.5) 
- **npm** (currently using v10.8.2)
- **.NET 8 SDK** (currently using v8.0.119)
- **Expo CLI** - installed via `npx expo` (version 54.0.7)

### Bootstrap, Build, and Test Sequence
**NEVER CANCEL builds or long-running commands. All timing estimates include safety buffers.**

1. **Backend (.NET 8 API) Setup:**
   ```bash
   cd VibMeBackend
   ```
   - `dotnet restore` -- Takes ~25 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
   - `dotnet build` -- Takes ~12 seconds. NEVER CANCEL. Set timeout to 30+ seconds.
   - **Build Warnings:** Expect 17 warnings about unused exception variables (non-blocking, code still works)

2. **Frontend (React Native/Expo) Setup:**
   ```bash
   cd VibMeApp
   ```
   - `npm install` -- Takes ~15 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
   - No additional build step required for development

### Running the Applications

**Backend Server:**
```bash
cd VibMeBackend
dotnet run
```
- Starts in ~3 seconds
- Runs on `http://localhost:5276` (note: port may vary, check console output)
- Swagger UI available at `http://localhost:5276/swagger`
- Health check endpoint: `http://localhost:5276/health`

**Frontend (React Native App):**
```bash
cd VibMeApp  
CI=true npx expo start
```
- Metro bundler runs on `http://localhost:8081`
- Use `CI=true` to prevent opening browser automatically
- Status endpoint: `http://localhost:8081/status` (should return "packager-status:running")

### Testing and Validation

**No automated tests are configured.** Manual validation is required:

1. **Backend API Validation:**
   ```bash
   # Test demo user login (pre-seeded)
   curl -X POST "http://localhost:5276/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"username":"demo","password":"demo123"}'
   
   # Test user registration
   curl -X POST "http://localhost:5276/api/auth/register" \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","email":"test@test.com","password":"testpass123"}'
   
   # View all available endpoints
   curl -s "http://localhost:5276/swagger/v1/swagger.json"
   ```

2. **Demo User Account:**
   - Username: `demo`
   - Password: `demo123`
   - Email: `demo@vibme.com`
   - Has 1 connected device pre-configured

3. **Manual End-to-End Validation:**
   - ALWAYS test the login flow using the demo account
   - Verify the API endpoints return valid JSON responses
   - Check that both frontend and backend start without errors
   - Test basic authentication and user management workflows

## Architecture Overview

### Frontend: React Native Mobile App (`VibMeApp/`)
- **Cross-platform**: Single codebase runs on both iOS and Android
- **Framework**: React Native with Expo (v54.0.9)
- **Real-time communication**: SignalR client (@microsoft/signalr v9.0.6)
- **Navigation**: React Navigation v7 with bottom tabs and stack navigation
- **Storage**: AsyncStorage for user data and settings
- **Haptic feedback**: Expo Haptics for vibration testing

**Key Frontend Structure:**
```
VibMeApp/
├── src/
│   ├── screens/           # Main app screens
│   │   ├── LoginScreen.js         # Authentication
│   │   ├── DevicesScreen.js       # Device management  
│   │   ├── ControllerScreen.js    # Vibration control
│   │   ├── TemperatureScreen.js   # Temperature monitoring
│   │   └── SettingsScreen.js      # User settings
│   ├── context/           # React context providers
│   │   ├── AuthContext.js         # Authentication state
│   │   └── DeviceContext.js       # Device management state
│   └── services/          # API and communication services
│       ├── ApiService.js          # REST API client
│       ├── AuthService.js         # Authentication logic
│       ├── DeviceService.js       # Device management
│       └── SignalRService.js      # Real-time communication
└── App.js                 # Main app component with navigation
```

### Backend: .NET 8 Web API + SignalR (`VibMeBackend/`)
- **Framework**: ASP.NET Core 8.0 Web API
- **Database**: Entity Framework Core with in-memory storage (demo purposes)
- **Real-time**: SignalR hub for instant communication
- **Authentication**: BCrypt password hashing
- **API Documentation**: Swagger/OpenAPI

**Key Backend Structure:**
```
VibMeBackend/
├── Controllers/           # REST API controllers
│   ├── AuthController.cs         # Authentication endpoints
│   ├── DevicesController.cs      # Device management CRUD
│   └── TemperatureController.cs  # Temperature monitoring
├── Models/                # Data models and DTOs
│   └── VibMeModels.cs            # Complete data model definitions
├── Data/                  # Entity Framework DbContext
│   └── VibMeDbContext.cs         # Database configuration and seeding
├── Hubs/                  # SignalR real-time hubs
│   └── VibMeHub.cs               # Real-time communication hub
└── Program.cs             # Application startup and configuration
```

## Configuration

**API Base URL Configuration:**
- Update `VibMeApp/src/services/ApiService.js`: Change `BASE_URL` constant
- Update `VibMeApp/src/services/SignalRService.js`: Change SignalR hub URL
- Default: `http://localhost:5276` (backend may use different port)

**Database:**
- Uses Entity Framework Core in-memory database
- Data is seeded on startup with demo user and sample devices
- No persistent storage - data resets on server restart

## Available API Endpoints

The backend provides 18 REST endpoints:

**Authentication:**
- `POST /api/Auth/register` - User registration
- `POST /api/Auth/login` - User login
- `POST /api/Auth/logout/{userId}` - User logout
- `GET /api/Auth/user/{userId}` - Get user details

**Device Management:**
- `GET /api/Devices/user/{userId}` - Get user's devices
- `POST /api/Devices` - Create new device
- `GET /api/Devices/{id}` - Get device details
- `PUT /api/Devices/{id}` - Update device
- `DELETE /api/Devices/{id}` - Delete device
- `POST /api/Devices/{id}/connect` - Connect to device
- `POST /api/Devices/{id}/disconnect` - Disconnect from device

**Temperature Monitoring:**
- `GET /api/Temperature/device/{deviceId}` - Get device temperature history
- `DELETE /api/Temperature/device/{deviceId}` - Clear temperature history
- `GET /api/Temperature/device/{deviceId}/latest` - Get latest temperature
- `POST /api/Temperature` - Record temperature reading
- `GET /api/Temperature/alerts/user/{userId}` - Get temperature alerts
- `GET /api/Temperature/stats/device/{deviceId}` - Get temperature statistics

**Health Check:**
- `GET /health` - Service health status

## Common Development Tasks

### Adding New Features
- **Frontend changes**: Always check corresponding screen in `VibMeApp/src/screens/`
- **Backend changes**: Check appropriate controller in `VibMeBackend/Controllers/`
- **Database changes**: Update models in `VibMeBackend/Models/VibMeModels.cs` and seeding in `VibMeBackend/Data/VibMeDbContext.cs`
- **Real-time features**: Update `VibMeBackend/Hubs/VibMeHub.cs` and corresponding frontend SignalR service

### Debugging and Troubleshooting
- **Backend errors**: Check console output when running `dotnet run`
- **Frontend errors**: Check Metro bundler output when running `expo start`
- **API testing**: Use Swagger UI at `http://localhost:5276/swagger` for interactive testing
- **Network issues**: Verify both servers are running and ports are accessible

### Key Files to Check When Making Changes
- **Authentication**: `AuthController.cs` ↔ `AuthContext.js` ↔ `LoginScreen.js`
- **Device management**: `DevicesController.cs` ↔ `DeviceContext.js` ↔ `DevicesScreen.js`
- **Vibration control**: `VibMeHub.cs` ↔ `SignalRService.js` ↔ `ControllerScreen.js`
- **Temperature monitoring**: `TemperatureController.cs` ↔ `TemperatureScreen.js`
- **API configuration**: `ApiService.js` (frontend) ↔ `Program.cs` (backend CORS)

## Project Limitations and Notes

- **No linting or formatting tools configured** - follow existing code style
- **No automated testing** - rely on manual validation
- **In-memory database** - data is not persistent across server restarts
- **Build warnings** - 17 warnings about unused exception variables are expected and non-blocking
- **Mobile testing** - Requires iOS Simulator (Mac) or Android Studio for device testing
- **Real-time features** - SignalR hub requires both frontend and backend to be running simultaneously

## Frequently Used Commands Summary

```bash
# Backend development
cd VibMeBackend
dotnet restore          # ~25 seconds
dotnet build           # ~12 seconds  
dotnet run             # Starts on port 5276

# Frontend development  
cd VibMeApp
npm install            # ~15 seconds
CI=true npx expo start # Starts Metro on port 8081

# API testing
curl -X POST "http://localhost:5276/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'
```
=======
# VibMe - Cross-Platform Vibration Control Application

VibMe is a cross-platform application consisting of a React Native mobile app and a .NET 8 Web API backend with SignalR for real-time communication. The application allows users to control vibration devices safely with comprehensive authentication and monitoring features.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Prerequisites and Installation
- Install Node.js 18+ and npm (validated with Node.js 20.19.5, npm 10.8.2)
- Install .NET 8 SDK (validated with .NET 8.0.119)
- Install Expo CLI globally: `npm install -g @expo/cli`
- iOS Simulator requires macOS, Android Studio for Android development

### Backend Setup (.NET 8 API)
- Navigate to backend: `cd VibMeBackend`
- Restore dependencies: `dotnet restore` -- takes ~1 second (already cached), NEVER CANCEL. Set timeout to 60+ seconds.
- Build backend: `dotnet build` -- takes ~5 seconds, NEVER CANCEL. Set timeout to 60+ seconds.
- Clean and rebuild: `dotnet clean && dotnet build` -- takes ~4 seconds total, NEVER CANCEL. Set timeout to 60+ seconds.
- Run backend: `dotnet run` -- starts server on http://localhost:5276 (note: port differs from README)
- The API includes Swagger documentation available at http://localhost:5276/swagger when running

### Mobile App Setup (React Native with Expo)
- Navigate to app: `cd VibMeApp`
- Install dependencies: `npm install` -- takes ~1-13 seconds depending on cache, NEVER CANCEL. Set timeout to 60+ seconds.
- Start development server: `npx expo start`
- For CI environments use: `env CI=1 npx expo start` (non-interactive mode)
- Platform options: Press `i` for iOS Simulator, `a` for Android Emulator, or scan QR code with Expo Go

### Network Restrictions and Workarounds
- **DNS Blocks**: In some environments, `api.expo.dev` and `cdp.expo.dev` may be blocked by firewall
- **Symptoms**: Expo commands may fail with connection errors or DNS resolution issues
- **Expected Behavior**: Commands may appear to hang during npm package installation or dependency validation
- **Workarounds**:
  - Use `env CI=1 npx expo start` for offline/restricted environments
  - Metro bundler will run in CI mode with networking disabled
  - Commands may take longer due to npm package installation warnings
  - Add blocked domains to allowlist in repository's Copilot coding agent settings if admin access available
  - **Note**: Expo functionality is limited in offline mode but Metro bundler still works for development

### Configuration Requirements
- Update API base URL in `VibMeApp/src/services/ApiService.js`: Change `http://localhost:5000/api` to actual backend URL
- Update SignalR URL in `VibMeApp/src/services/SignalRService.js`: Change `http://localhost:5000/vibmehub` to actual backend URL
- Default development server runs on port 5276, not 5000 as mentioned in configuration files

## Validation and Testing

### Backend API Validation
Always validate backend functionality with these tested scenarios:
- Demo user login: `curl -X POST http://localhost:5276/api/auth/login -H "Content-Type: application/json" -d '{"username":"demo","password":"demo123"}'`
- Get user profile: `curl http://localhost:5276/api/auth/user/11111111-1111-1111-1111-111111111111`
- Get user devices: `curl http://localhost:5276/api/devices/user/11111111-1111-1111-1111-111111111111`
- All successful responses return `"success":true` in JSON format

### Demo User Credentials
- Username: `demo`
- Password: `demo123`  
- User ID: `11111111-1111-1111-1111-111111111111`
- Always use these credentials for testing authentication and user scenarios

### Manual Validation Scenarios
After making changes, ALWAYS test these complete end-to-end scenarios:
1. **Backend API Test**: Start backend, test login endpoint, verify demo user authentication works
2. **Device Management Test**: Retrieve user devices, verify seeded demo devices are accessible
3. **React Native App Test**: Start Expo server, verify it launches without errors (interactive testing requires simulator/device)
4. **Configuration Test**: Verify API URLs in service files match the running backend port

### Build Warnings
The backend build produces 17 warnings about unused variables in catch blocks - these are expected and do not affect functionality. Do not attempt to fix these unless specifically requested.

## Project Structure

### Mobile App (VibMeApp/)
```
VibMeApp/
├── src/
│   ├── screens/           # Main app screens (Login, Devices, Controller, Temperature, Settings)
│   ├── context/           # React context providers (Auth, Device)
│   ├── services/          # API and communication services (ApiService, SignalRService)
│   └── components/        # Reusable UI components
├── App.js                 # Main app component with navigation
├── index.js               # Entry point
├── package.json           # Dependencies and scripts
└── app.json               # Expo configuration
```

### Backend API (VibMeBackend/)
```
VibMeBackend/
├── Controllers/           # REST API controllers (Auth, Devices, Temperature)
├── Models/                # Data models and DTOs (VibMeModels.cs)
├── Data/                  # Entity Framework DbContext (VibMeDbContext.cs)  
├── Hubs/                  # SignalR real-time hubs (VibMeHub.cs)
├── Program.cs             # Application startup and configuration
└── VibMeBackend.csproj    # Project file with dependencies
```

## Key Technologies and Dependencies

### Mobile App Dependencies
- React Native with Expo (~54.0.9)
- Navigation: @react-navigation/native, @react-navigation/stack, @react-navigation/bottom-tabs
- Real-time: @microsoft/signalr (^9.0.6)
- Storage: @react-native-async-storage/async-storage
- UI: react-native-vector-icons (migrating - see deprecation warning)
- Sensors: expo-haptics, expo-sensors, expo-device

### Backend Dependencies  
- .NET 8 Web API with SignalR
- Entity Framework Core with In-Memory database
- BCrypt.Net-Next for password hashing
- Swashbuckle.AspNetCore for API documentation
- CORS enabled for cross-platform access

## Common Tasks

### Development Workflow
1. Start backend: `cd VibMeBackend && dotnet run`
2. Start mobile app: `cd VibMeApp && npx expo start`
3. Test API endpoints using curl or visit /swagger
4. Test mobile app using iOS simulator, Android emulator, or Expo Go

### Troubleshooting
- If backend fails to start, check port 5276 is available
- If mobile app fails to connect, verify API URLs in service files match backend port
- Build artifacts in bin/ and obj/ folders are excluded from git
- React Native vector icons deprecation warning is expected and doesn't affect functionality
- **Network Issues**: If Expo commands fail due to DNS blocks (`api.expo.dev`, `cdp.expo.dev`), use `env CI=1 npx expo start` for offline mode
- **Firewall Restrictions**: Metro bundler will run in CI mode with networking disabled when external Expo services are blocked

### No Testing Infrastructure
This project does not have unit tests or automated testing configured. Manual validation through API endpoints and app functionality is the primary testing method.

## Database and Seeded Data

### In-Memory Database
- Uses Entity Framework Core with in-memory storage
- Data is lost when backend restarts
- Automatically seeds demo user and devices on startup

### Seeded Demo Data
- Demo user: `demo` / `demo123` (ID: 11111111-1111-1111-1111-111111111111)
- Two demo vibration devices with different patterns and settings
- Temperature readings and vibration settings pre-configured
- Always use demo user for testing and validation scenarios

