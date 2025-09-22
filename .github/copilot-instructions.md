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