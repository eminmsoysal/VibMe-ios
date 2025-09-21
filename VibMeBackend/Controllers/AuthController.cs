using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VibMeBackend.Data;
using VibMeBackend.Models;
using System.ComponentModel.DataAnnotations;

namespace VibMeBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly VibMeDbContext _context;

        public AuthController(VibMeDbContext context)
        {
            _context = context;
        }

        [HttpPost("register")]
        public async Task<ActionResult<ApiResponse<UserDto>>> Register([FromBody] RegisterRequest request)
        {
            try
            {
                // Validate request
                if (!ModelState.IsValid)
                {
                    return BadRequest(new ApiResponse<UserDto>
                    {
                        Success = false,
                        Message = "Invalid input data",
                        Data = null
                    });
                }

                // Check if user already exists
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == request.Username || u.Email == request.Email);

                if (existingUser != null)
                {
                    return Conflict(new ApiResponse<UserDto>
                    {
                        Success = false,
                        Message = existingUser.Username == request.Username 
                            ? "Username already exists" 
                            : "Email already exists",
                        Data = null
                    });
                }

                // Create new user
                var user = new User
                {
                    Username = request.Username,
                    Email = request.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    CreatedAt = DateTime.UtcNow,
                    LastLoginAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                var userDto = new UserDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    CreatedAt = user.CreatedAt,
                    LastLoginAt = user.LastLoginAt,
                    ConnectedDevicesCount = 0
                };

                return Ok(new ApiResponse<UserDto>
                {
                    Success = true,
                    Message = "User registered successfully",
                    Data = userDto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<UserDto>
                {
                    Success = false,
                    Message = "Registration failed",
                    Data = null
                });
            }
        }

        [HttpPost("login")]
        public async Task<ActionResult<ApiResponse<UserDto>>> Login([FromBody] LoginRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new ApiResponse<UserDto>
                    {
                        Success = false,
                        Message = "Invalid input data",
                        Data = null
                    });
                }

                // Find user
                var user = await _context.Users
                    .Include(u => u.Devices)
                    .FirstOrDefaultAsync(u => u.Username == request.Username);

                if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                {
                    return Unauthorized(new ApiResponse<UserDto>
                    {
                        Success = false,
                        Message = "Invalid username or password",
                        Data = null
                    });
                }

                // Update last login
                user.LastLoginAt = DateTime.UtcNow;
                user.IsLoggedIn = true;
                await _context.SaveChangesAsync();

                var userDto = new UserDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    CreatedAt = user.CreatedAt,
                    LastLoginAt = user.LastLoginAt,
                    ConnectedDevicesCount = user.Devices.Count(d => d.Status == DeviceStatus.Connected)
                };

                return Ok(new ApiResponse<UserDto>
                {
                    Success = true,
                    Message = "Login successful",
                    Data = userDto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<UserDto>
                {
                    Success = false,
                    Message = "Login failed",
                    Data = null
                });
            }
        }

        [HttpPost("logout/{userId}")]
        public async Task<ActionResult<ApiResponse<object>>> Logout(Guid userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user != null)
                {
                    user.IsLoggedIn = false;
                    await _context.SaveChangesAsync();
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Logout successful",
                    Data = null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Logout failed",
                    Data = null
                });
            }
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<ApiResponse<UserDto>>> GetUser(Guid userId)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.Devices)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                {
                    return NotFound(new ApiResponse<UserDto>
                    {
                        Success = false,
                        Message = "User not found",
                        Data = null
                    });
                }

                var userDto = new UserDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    CreatedAt = user.CreatedAt,
                    LastLoginAt = user.LastLoginAt,
                    ConnectedDevicesCount = user.Devices.Count(d => d.Status == DeviceStatus.Connected)
                };

                return Ok(new ApiResponse<UserDto>
                {
                    Success = true,
                    Message = "User found",
                    Data = userDto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<UserDto>
                {
                    Success = false,
                    Message = "Failed to get user",
                    Data = null
                });
            }
        }
    }
}