import Foundation
import Combine

@MainActor
class AuthenticationManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let userDefaultsKey = "VibMe_CurrentUser"
    
    init() {
        loadSavedUser()
    }
    
    func signIn(username: String, password: String) async {
        isLoading = true
        errorMessage = nil
        
        // Simulate network request
        try? await Task.sleep(nanoseconds: 1_000_000_000) // 1 second
        
        // Simple validation for demo purposes
        if username.isEmpty || password.isEmpty {
            errorMessage = "Please enter both username and password"
            isLoading = false
            return
        }
        
        if password.count < 6 {
            errorMessage = "Password must be at least 6 characters long"
            isLoading = false
            return
        }
        
        // Create user (in a real app, this would be handled by a backend)
        let user = User(username: username, email: "\(username)@vibme.com")
        currentUser = user
        isAuthenticated = true
        
        saveUser()
        isLoading = false
    }
    
    func signUp(username: String, email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        
        // Simulate network request
        try? await Task.sleep(nanoseconds: 1_500_000_000) // 1.5 seconds
        
        // Simple validation
        if username.isEmpty || email.isEmpty || password.isEmpty {
            errorMessage = "Please fill in all fields"
            isLoading = false
            return
        }
        
        if !email.contains("@") {
            errorMessage = "Please enter a valid email address"
            isLoading = false
            return
        }
        
        if password.count < 6 {
            errorMessage = "Password must be at least 6 characters long"
            isLoading = false
            return
        }
        
        // Create user
        let user = User(username: username, email: email)
        currentUser = user
        isAuthenticated = true
        
        saveUser()
        isLoading = false
    }
    
    func signOut() {
        currentUser = nil
        isAuthenticated = false
        UserDefaults.standard.removeObject(forKey: userDefaultsKey)
    }
    
    func updateDeviceSettings(deviceId: String, settings: VibrationSettings) {
        guard var user = currentUser else { return }
        user.deviceSettings[deviceId] = settings
        currentUser = user
        saveUser()
    }
    
    func connectDevice(deviceId: String) {
        guard var user = currentUser else { return }
        if !user.connectedDevices.contains(deviceId) {
            user.connectedDevices.append(deviceId)
            currentUser = user
            saveUser()
        }
    }
    
    func disconnectDevice(deviceId: String) {
        guard var user = currentUser else { return }
        user.connectedDevices.removeAll { $0 == deviceId }
        currentUser = user
        saveUser()
    }
    
    // MARK: - Private Methods
    
    private func saveUser() {
        guard let user = currentUser else { return }
        
        do {
            let data = try JSONEncoder().encode(user)
            UserDefaults.standard.set(data, forKey: userDefaultsKey)
        } catch {
            print("Failed to save user: \(error)")
        }
    }
    
    private func loadSavedUser() {
        guard let data = UserDefaults.standard.data(forKey: userDefaultsKey) else { return }
        
        do {
            let user = try JSONDecoder().decode(User.self, from: data)
            currentUser = user
            isAuthenticated = true
        } catch {
            print("Failed to load user: \(error)")
            UserDefaults.standard.removeObject(forKey: userDefaultsKey)
        }
    }
}