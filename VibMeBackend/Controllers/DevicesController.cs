using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VibMeBackend.Data;
using VibMeBackend.Models;

namespace VibMeBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DevicesController : ControllerBase
    {
        private readonly VibMeDbContext _context;

        public DevicesController(VibMeDbContext context)
        {
            _context = context;
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<ApiResponse<List<DeviceDto>>>> GetUserDevices(Guid userId)
        {
            try
            {
                var devices = await _context.Devices
                    .Where(d => d.UserId == userId)
                    .ToListAsync();

                var deviceDtos = devices.Select(d => new DeviceDto
                {
                    Id = d.Id,
                    Name = d.Name,
                    Type = d.Type,
                    Role = d.Role,
                    ConnectionType = d.ConnectionType,
                    Status = d.Status,
                    BluetoothIdentifier = d.BluetoothIdentifier,
                    IpAddress = d.IpAddress,
                    Temperature = d.Temperature,
                    LastSeen = d.LastSeen,
                    BatteryLevel = d.BatteryLevel,
                    TemperatureSeverity = d.Temperature switch
                    {
                        < 35.0 => TemperatureSeverity.Normal,
                        >= 35.0 and < 40.0 => TemperatureSeverity.Warning,
                        >= 40.0 and < 45.0 => TemperatureSeverity.High,
                        _ => TemperatureSeverity.Critical
                    }
                }).ToList();

                return Ok(new ApiResponse<List<DeviceDto>>
                {
                    Success = true,
                    Message = $"Found {deviceDtos.Count} devices",
                    Data = deviceDtos
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<DeviceDto>>
                {
                    Success = false,
                    Message = "Failed to get devices",
                    Data = null
                });
            }
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<DeviceDto>>> CreateDevice([FromBody] VibrationDevice device)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new ApiResponse<DeviceDto>
                    {
                        Success = false,
                        Message = "Invalid device data",
                        Data = null
                    });
                }

                // Check if user exists
                var userExists = await _context.Users.AnyAsync(u => u.Id == device.UserId);
                if (!userExists)
                {
                    return BadRequest(new ApiResponse<DeviceDto>
                    {
                        Success = false,
                        Message = "User not found",
                        Data = null
                    });
                }

                device.Id = Guid.NewGuid();
                device.LastSeen = DateTime.UtcNow;

                _context.Devices.Add(device);
                await _context.SaveChangesAsync();

                var deviceDto = new DeviceDto
                {
                    Id = device.Id,
                    Name = device.Name,
                    Type = device.Type,
                    Role = device.Role,
                    ConnectionType = device.ConnectionType,
                    Status = device.Status,
                    BluetoothIdentifier = device.BluetoothIdentifier,
                    IpAddress = device.IpAddress,
                    Temperature = device.Temperature,
                    LastSeen = device.LastSeen,
                    BatteryLevel = device.BatteryLevel,
                    TemperatureSeverity = device.Temperature switch
                    {
                        < 35.0 => TemperatureSeverity.Normal,
                        >= 35.0 and < 40.0 => TemperatureSeverity.Warning,
                        >= 40.0 and < 45.0 => TemperatureSeverity.High,
                        _ => TemperatureSeverity.Critical
                    }
                };

                return CreatedAtAction(nameof(GetDevice), new { id = device.Id }, new ApiResponse<DeviceDto>
                {
                    Success = true,
                    Message = "Device created successfully",
                    Data = deviceDto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<DeviceDto>
                {
                    Success = false,
                    Message = "Failed to create device",
                    Data = null
                });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<DeviceDto>>> GetDevice(Guid id)
        {
            try
            {
                var device = await _context.Devices.FindAsync(id);
                if (device == null)
                {
                    return NotFound(new ApiResponse<DeviceDto>
                    {
                        Success = false,
                        Message = "Device not found",
                        Data = null
                    });
                }

                var deviceDto = new DeviceDto
                {
                    Id = device.Id,
                    Name = device.Name,
                    Type = device.Type,
                    Role = device.Role,
                    ConnectionType = device.ConnectionType,
                    Status = device.Status,
                    BluetoothIdentifier = device.BluetoothIdentifier,
                    IpAddress = device.IpAddress,
                    Temperature = device.Temperature,
                    LastSeen = device.LastSeen,
                    BatteryLevel = device.BatteryLevel,
                    TemperatureSeverity = device.Temperature switch
                    {
                        < 35.0 => TemperatureSeverity.Normal,
                        >= 35.0 and < 40.0 => TemperatureSeverity.Warning,
                        >= 40.0 and < 45.0 => TemperatureSeverity.High,
                        _ => TemperatureSeverity.Critical
                    }
                };

                return Ok(new ApiResponse<DeviceDto>
                {
                    Success = true,
                    Message = "Device found",
                    Data = deviceDto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<DeviceDto>
                {
                    Success = false,
                    Message = "Failed to get device",
                    Data = null
                });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<DeviceDto>>> UpdateDevice(Guid id, [FromBody] VibrationDevice updatedDevice)
        {
            try
            {
                if (id != updatedDevice.Id)
                {
                    return BadRequest(new ApiResponse<DeviceDto>
                    {
                        Success = false,
                        Message = "Device ID mismatch",
                        Data = null
                    });
                }

                var device = await _context.Devices.FindAsync(id);
                if (device == null)
                {
                    return NotFound(new ApiResponse<DeviceDto>
                    {
                        Success = false,
                        Message = "Device not found",
                        Data = null
                    });
                }

                device.Name = updatedDevice.Name;
                device.Type = updatedDevice.Type;
                device.Role = updatedDevice.Role;
                device.ConnectionType = updatedDevice.ConnectionType;
                device.Status = updatedDevice.Status;
                device.BluetoothIdentifier = updatedDevice.BluetoothIdentifier;
                device.IpAddress = updatedDevice.IpAddress;
                device.Temperature = updatedDevice.Temperature;
                device.BatteryLevel = updatedDevice.BatteryLevel;
                device.LastSeen = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var deviceDto = new DeviceDto
                {
                    Id = device.Id,
                    Name = device.Name,
                    Type = device.Type,
                    Role = device.Role,
                    ConnectionType = device.ConnectionType,
                    Status = device.Status,
                    BluetoothIdentifier = device.BluetoothIdentifier,
                    IpAddress = device.IpAddress,
                    Temperature = device.Temperature,
                    LastSeen = device.LastSeen,
                    BatteryLevel = device.BatteryLevel,
                    TemperatureSeverity = device.Temperature switch
                    {
                        < 35.0 => TemperatureSeverity.Normal,
                        >= 35.0 and < 40.0 => TemperatureSeverity.Warning,
                        >= 40.0 and < 45.0 => TemperatureSeverity.High,
                        _ => TemperatureSeverity.Critical
                    }
                };

                return Ok(new ApiResponse<DeviceDto>
                {
                    Success = true,
                    Message = "Device updated successfully",
                    Data = deviceDto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<DeviceDto>
                {
                    Success = false,
                    Message = "Failed to update device",
                    Data = null
                });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteDevice(Guid id)
        {
            try
            {
                var device = await _context.Devices.FindAsync(id);
                if (device == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Device not found",
                        Data = null
                    });
                }

                _context.Devices.Remove(device);
                await _context.SaveChangesAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Device deleted successfully",
                    Data = null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to delete device",
                    Data = null
                });
            }
        }

        [HttpPost("{id}/connect")]
        public async Task<ActionResult<ApiResponse<object>>> ConnectDevice(Guid id)
        {
            try
            {
                var device = await _context.Devices.FindAsync(id);
                if (device == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Device not found",
                        Data = null
                    });
                }

                device.Status = DeviceStatus.Connected;
                device.LastSeen = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Device connected successfully",
                    Data = null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to connect device",
                    Data = null
                });
            }
        }

        [HttpPost("{id}/disconnect")]
        public async Task<ActionResult<ApiResponse<object>>> DisconnectDevice(Guid id)
        {
            try
            {
                var device = await _context.Devices.FindAsync(id);
                if (device == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Device not found",
                        Data = null
                    });
                }

                device.Status = DeviceStatus.Disconnected;
                device.LastSeen = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Device disconnected successfully",
                    Data = null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to disconnect device",
                    Data = null
                });
            }
        }
    }
}