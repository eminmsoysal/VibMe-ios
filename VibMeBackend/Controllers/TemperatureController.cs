using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VibMeBackend.Data;
using VibMeBackend.Models;

namespace VibMeBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TemperatureController : ControllerBase
    {
        private readonly VibMeDbContext _context;

        public TemperatureController(VibMeDbContext context)
        {
            _context = context;
        }

        [HttpGet("device/{deviceId}")]
        public async Task<ActionResult<ApiResponse<List<TemperatureReading>>>> GetDeviceTemperatureHistory(Guid deviceId, int limit = 50)
        {
            try
            {
                var readings = await _context.TemperatureReadings
                    .Where(r => r.DeviceId == deviceId)
                    .OrderByDescending(r => r.Timestamp)
                    .Take(limit)
                    .ToListAsync();

                return Ok(new ApiResponse<List<TemperatureReading>>
                {
                    Success = true,
                    Message = $"Found {readings.Count} temperature readings",
                    Data = readings
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new ApiResponse<List<TemperatureReading>>
                {
                    Success = false,
                    Message = "Failed to get temperature history",
                    Data = null
                });
            }
        }

        [HttpGet("device/{deviceId}/latest")]
        public async Task<ActionResult<ApiResponse<TemperatureReading?>>> GetLatestTemperature(Guid deviceId)
        {
            try
            {
                var latestReading = await _context.TemperatureReadings
                    .Where(r => r.DeviceId == deviceId)
                    .OrderByDescending(r => r.Timestamp)
                    .FirstOrDefaultAsync();

                return Ok(new ApiResponse<TemperatureReading?>
                {
                    Success = true,
                    Message = latestReading != null ? "Latest temperature found" : "No temperature readings found",
                    Data = latestReading
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new ApiResponse<TemperatureReading?>
                {
                    Success = false,
                    Message = "Failed to get latest temperature",
                    Data = null
                });
            }
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<TemperatureReading>>> RecordTemperature([FromBody] TemperatureReading reading)
        {
            try
            {
                // Verify device exists
                var deviceExists = await _context.Devices.AnyAsync(d => d.Id == reading.DeviceId);
                if (!deviceExists)
                {
                    return NotFound(new ApiResponse<TemperatureReading>
                    {
                        Success = false,
                        Message = "Device not found",
                        Data = null
                    });
                }

                reading.Id = Guid.NewGuid();
                reading.Timestamp = DateTime.UtcNow;

                _context.TemperatureReadings.Add(reading);

                // Update device temperature
                var device = await _context.Devices.FindAsync(reading.DeviceId);
                if (device != null)
                {
                    device.Temperature = reading.Temperature;
                    device.LastSeen = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetLatestTemperature), 
                    new { deviceId = reading.DeviceId }, 
                    new ApiResponse<TemperatureReading>
                    {
                        Success = true,
                        Message = "Temperature recorded successfully",
                        Data = reading
                    });
            }
            catch (Exception)
            {
                return StatusCode(500, new ApiResponse<TemperatureReading>
                {
                    Success = false,
                    Message = "Failed to record temperature",
                    Data = null
                });
            }
        }

        [HttpGet("alerts/user/{userId}")]
        public async Task<ActionResult<ApiResponse<List<object>>>> GetTemperatureAlerts(Guid userId)
        {
            try
            {
                var alerts = await _context.TemperatureReadings
                    .Join(_context.Devices, r => r.DeviceId, d => d.Id, (r, d) => new { Reading = r, Device = d })
                    .Where(x => x.Device.UserId == userId && x.Reading.Temperature >= 35.0)
                    .OrderByDescending(x => x.Reading.Timestamp)
                    .Take(100)
                    .Select(x => new
                    {
                        Id = x.Reading.Id,
                        DeviceId = x.Reading.DeviceId,
                        DeviceName = x.Device.Name,
                        Temperature = x.Reading.Temperature,
                        Severity = x.Reading.Severity.ToString(),
                        Timestamp = x.Reading.Timestamp,
                        IsNormal = x.Reading.IsNormal
                    })
                    .ToListAsync();

                return Ok(new ApiResponse<List<object>>
                {
                    Success = true,
                    Message = $"Found {alerts.Count} temperature alerts",
                    Data = alerts.Cast<object>().ToList()
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new ApiResponse<List<object>>
                {
                    Success = false,
                    Message = "Failed to get temperature alerts",
                    Data = null
                });
            }
        }

        [HttpGet("stats/device/{deviceId}")]
        public async Task<ActionResult<ApiResponse<object>>> GetTemperatureStats(Guid deviceId, int hours = 24)
        {
            try
            {
                var cutoffTime = DateTime.UtcNow.AddHours(-hours);

                var readings = await _context.TemperatureReadings
                    .Where(r => r.DeviceId == deviceId && r.Timestamp >= cutoffTime)
                    .ToListAsync();

                if (!readings.Any())
                {
                    return Ok(new ApiResponse<object>
                    {
                        Success = true,
                        Message = "No temperature data found for the specified period",
                        Data = new
                        {
                            DeviceId = deviceId,
                            Period = $"{hours} hours",
                            ReadingCount = 0,
                            AverageTemperature = 0.0,
                            MinTemperature = 0.0,
                            MaxTemperature = 0.0,
                            CurrentTemperature = 0.0,
                            AlertCount = 0
                        }
                    });
                }

                var stats = new
                {
                    DeviceId = deviceId,
                    Period = $"{hours} hours",
                    ReadingCount = readings.Count,
                    AverageTemperature = readings.Average(r => r.Temperature),
                    MinTemperature = readings.Min(r => r.Temperature),
                    MaxTemperature = readings.Max(r => r.Temperature),
                    CurrentTemperature = readings.OrderByDescending(r => r.Timestamp).First().Temperature,
                    AlertCount = readings.Count(r => r.Severity >= TemperatureSeverity.Warning),
                    TemperatureTrend = CalculateTemperatureTrend(readings),
                    SeverityDistribution = readings.GroupBy(r => r.Severity)
                        .ToDictionary(g => g.Key.ToString(), g => g.Count())
                };

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Temperature statistics calculated",
                    Data = stats
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to calculate temperature statistics",
                    Data = null
                });
            }
        }

        [HttpDelete("device/{deviceId}")]
        public async Task<ActionResult<ApiResponse<object>>> ClearTemperatureHistory(Guid deviceId)
        {
            try
            {
                var readings = await _context.TemperatureReadings
                    .Where(r => r.DeviceId == deviceId)
                    .ToListAsync();

                _context.TemperatureReadings.RemoveRange(readings);
                await _context.SaveChangesAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = $"Cleared {readings.Count} temperature readings",
                    Data = null
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to clear temperature history",
                    Data = null
                });
            }
        }

        private string CalculateTemperatureTrend(List<TemperatureReading> readings)
        {
            if (readings.Count < 2)
                return "Stable";

            var orderedReadings = readings.OrderBy(r => r.Timestamp).ToList();
            var firstHalf = orderedReadings.Take(orderedReadings.Count / 2).Average(r => r.Temperature);
            var secondHalf = orderedReadings.Skip(orderedReadings.Count / 2).Average(r => r.Temperature);

            var difference = secondHalf - firstHalf;

            return difference switch
            {
                > 2.0 => "Rising",
                < -2.0 => "Falling",
                _ => "Stable"
            };
        }
    }
}