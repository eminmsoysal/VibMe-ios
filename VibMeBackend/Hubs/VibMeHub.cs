using Microsoft.AspNetCore.SignalR;
using VibMeBackend.Models;
using VibMeBackend.Data;
using Microsoft.EntityFrameworkCore;

namespace VibMeBackend.Hubs
{
    public class VibMeHub : Hub
    {
        private readonly VibMeDbContext _context;

        public VibMeHub(VibMeDbContext context)
        {
            _context = context;
        }

        public async Task JoinDeviceGroup(string deviceId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"device_{deviceId}");
        }

        public async Task LeaveDeviceGroup(string deviceId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"device_{deviceId}");
        }

        public async Task JoinUserGroup(string userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        public async Task SendVibrationCommand(VibrationCommand command)
        {
            // Save command to database
            _context.VibrationCommands.Add(command);
            await _context.SaveChangesAsync();

            // Send to target device
            await Clients.Group($"device_{command.TargetDeviceId}")
                .SendAsync("VibrationCommand", command);

            // Notify sender
            await Clients.Caller.SendAsync("CommandSent", new { 
                CommandId = command.Id,
                Success = true,
                Timestamp = DateTime.UtcNow
            });
        }

        public async Task SendEmergencyStop(string targetDeviceId, string senderId)
        {
            var emergencyCommand = new VibrationCommand
            {
                Id = Guid.NewGuid(),
                Pattern = VibrationPattern.Steady,
                Intensity = 0.0,
                Duration = 0.0,
                TargetDeviceId = targetDeviceId,
                IsEmergencyStop = true,
                SenderId = senderId,
                CreatedAt = DateTime.UtcNow
            };

            // Save to database
            _context.VibrationCommands.Add(emergencyCommand);
            await _context.SaveChangesAsync();

            // Send emergency stop to target device
            await Clients.Group($"device_{targetDeviceId}")
                .SendAsync("EmergencyStop", emergencyCommand);

            // Notify all users in sender's group
            await Clients.Group($"user_{senderId}")
                .SendAsync("EmergencyStopSent", new {
                    TargetDeviceId = targetDeviceId,
                    Timestamp = DateTime.UtcNow
                });
        }

        public async Task UpdateDeviceStatus(string deviceId, DeviceStatus status, double temperature, double? batteryLevel)
        {
            try
            {
                var device = await _context.Devices.FindAsync(Guid.Parse(deviceId));
                if (device != null)
                {
                    device.Status = status;
                    device.Temperature = temperature;
                    device.BatteryLevel = batteryLevel;
                    device.LastSeen = DateTime.UtcNow;

                    await _context.SaveChangesAsync();

                    // Save temperature reading
                    var temperatureReading = new TemperatureReading
                    {
                        DeviceId = device.Id,
                        Temperature = temperature,
                        Timestamp = DateTime.UtcNow
                    };

                    _context.TemperatureReadings.Add(temperatureReading);
                    await _context.SaveChangesAsync();

                    // Notify user group about device update
                    await Clients.Group($"user_{device.UserId}")
                        .SendAsync("DeviceStatusUpdate", new {
                            DeviceId = deviceId,
                            Status = status.ToString(),
                            Temperature = temperature,
                            BatteryLevel = batteryLevel,
                            TemperatureSeverity = temperatureReading.Severity.ToString(),
                            Timestamp = DateTime.UtcNow
                        });

                    // Send temperature alert if needed
                    if (temperatureReading.Severity >= TemperatureSeverity.Warning)
                    {
                        await Clients.Group($"user_{device.UserId}")
                            .SendAsync("TemperatureAlert", new {
                                DeviceId = deviceId,
                                DeviceName = device.Name,
                                Temperature = temperature,
                                Severity = temperatureReading.Severity.ToString(),
                                IsNormal = temperatureReading.IsNormal,
                                Timestamp = DateTime.UtcNow
                            });
                    }
                }
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("Error", new {
                    Message = "Failed to update device status",
                    Details = ex.Message,
                    Timestamp = DateTime.UtcNow
                });
            }
        }

        public async Task DiscoverDevices()
        {
            // Simulate device discovery
            var discoveredDevices = new[]
            {
                new {
                    Id = Guid.NewGuid().ToString(),
                    Name = "Nearby iPhone",
                    Type = "iOSPhone",
                    ConnectionType = "Bluetooth",
                    SignalStrength = -45
                },
                new {
                    Id = Guid.NewGuid().ToString(),
                    Name = "Android Device",
                    Type = "AndroidPhone",
                    ConnectionType = "Online",
                    SignalStrength = -60
                },
                new {
                    Id = Guid.NewGuid().ToString(),
                    Name = "Smart Watch",
                    Type = "SmartWatch",
                    ConnectionType = "Bluetooth",
                    SignalStrength = -38
                }
            };

            await Clients.Caller.SendAsync("DevicesDiscovered", discoveredDevices);
        }

        public async Task SendHeartbeat(string deviceId)
        {
            try
            {
                var device = await _context.Devices.FindAsync(Guid.Parse(deviceId));
                if (device != null)
                {
                    device.LastSeen = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                await Clients.Caller.SendAsync("HeartbeatAck", new {
                    DeviceId = deviceId,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("Error", new {
                    Message = "Heartbeat failed",
                    Details = ex.Message,
                    Timestamp = DateTime.UtcNow
                });
            }
        }

        public override async Task OnConnectedAsync()
        {
            await Clients.Caller.SendAsync("Connected", new {
                ConnectionId = Context.ConnectionId,
                Timestamp = DateTime.UtcNow
            });

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            // Handle disconnection cleanup if needed
            await base.OnDisconnectedAsync(exception);
        }
    }
}