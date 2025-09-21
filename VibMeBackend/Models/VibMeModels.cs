using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VibMeBackend.Models
{
    public enum DeviceType
    {
        iOSPhone,
        AndroidPhone,
        SmartWatch,
        WindowsPC,
        macOS
    }

    public enum DeviceRole
    {
        Controller,
        Target
    }

    public enum ConnectionType
    {
        Bluetooth,
        Online,
        Local
    }

    public enum DeviceStatus
    {
        Disconnected,
        Connecting,
        Connected,
        Error
    }

    public class VibrationDevice
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        public DeviceType Type { get; set; }
        public DeviceRole Role { get; set; }
        public ConnectionType ConnectionType { get; set; }
        public DeviceStatus Status { get; set; } = DeviceStatus.Disconnected;
        
        [MaxLength(255)]
        public string? BluetoothIdentifier { get; set; }
        
        [MaxLength(45)]
        public string? IpAddress { get; set; }
        
        public double Temperature { get; set; } = 20.0;
        public DateTime LastSeen { get; set; } = DateTime.UtcNow;
        public double? BatteryLevel { get; set; }
        
        // Foreign key
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
    }

    public enum VibrationPattern
    {
        Pulse,
        Wave,
        Heartbeat,
        Rhythm,
        Steady,
        Custom
    }

    public class VibrationSettings
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        
        public VibrationPattern Pattern { get; set; }
        public double Intensity { get; set; } = 0.5; // 0.0 to 1.0
        public double Duration { get; set; } = 1.0; // in seconds
        public double IntervalBetweenPatterns { get; set; } = 0.5;
        public bool IsRepeating { get; set; } = false;
        
        // Foreign key
        public Guid DeviceId { get; set; }
        public VibrationDevice Device { get; set; } = null!;
    }

    public class User
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        [MaxLength(50)]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(255)]
        public string PasswordHash { get; set; } = string.Empty;
        
        public bool IsLoggedIn { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastLoginAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public ICollection<VibrationDevice> Devices { get; set; } = new List<VibrationDevice>();
    }

    public enum TemperatureSeverity
    {
        Normal,
        Warning,
        High,
        Critical
    }

    public class TemperatureReading
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        
        public Guid DeviceId { get; set; }
        public double Temperature { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        
        public TemperatureSeverity Severity => Temperature switch
        {
            < 35.0 => TemperatureSeverity.Normal,
            >= 35.0 and < 40.0 => TemperatureSeverity.Warning,
            >= 40.0 and < 45.0 => TemperatureSeverity.High,
            _ => TemperatureSeverity.Critical
        };
        
        public bool IsNormal => Temperature < 40.0;
        
        // Navigation property
        public VibrationDevice Device { get; set; } = null!;
    }

    public enum MessageType
    {
        VibrationCommand,
        StatusUpdate,
        TemperatureAlert,
        DeviceDiscovery,
        Authentication,
        Heartbeat,
        EmergencyStop
    }

    public class NetworkMessage
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        
        public MessageType Type { get; set; }
        
        [Required]
        [MaxLength(36)]
        public string SenderId { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(36)]
        public string ReceiverId { get; set; } = string.Empty;
        
        public string Payload { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class VibrationCommand
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        
        public VibrationPattern Pattern { get; set; }
        public double Intensity { get; set; }
        public double Duration { get; set; }
        public double IntervalBetweenPatterns { get; set; }
        public bool IsRepeating { get; set; }
        
        [Required]
        [MaxLength(36)]
        public string TargetDeviceId { get; set; } = string.Empty;
        
        public DateTime? ExecutionTime { get; set; }
        public bool IsEmergencyStop { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [MaxLength(36)]
        public string SenderId { get; set; } = string.Empty;
    }

    // DTOs for API responses
    public class LoginRequest
    {
        [Required]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterRequest
    {
        [Required]
        [MaxLength(50)]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;
    }

    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class UserDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime LastLoginAt { get; set; }
        public int ConnectedDevicesCount { get; set; }
    }

    public class DeviceDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DeviceType Type { get; set; }
        public DeviceRole Role { get; set; }
        public ConnectionType ConnectionType { get; set; }
        public DeviceStatus Status { get; set; }
        public string? BluetoothIdentifier { get; set; }
        public string? IpAddress { get; set; }
        public double Temperature { get; set; }
        public DateTime LastSeen { get; set; }
        public double? BatteryLevel { get; set; }
        public TemperatureSeverity TemperatureSeverity { get; set; }
    }
}