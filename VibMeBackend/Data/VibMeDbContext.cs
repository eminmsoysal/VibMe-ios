using Microsoft.EntityFrameworkCore;
using VibMeBackend.Models;

namespace VibMeBackend.Data
{
    public class VibMeDbContext : DbContext
    {
        public VibMeDbContext(DbContextOptions<VibMeDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<VibrationDevice> Devices { get; set; }
        public DbSet<VibrationSettings> VibrationSettings { get; set; }
        public DbSet<TemperatureReading> TemperatureReadings { get; set; }
        public DbSet<NetworkMessage> NetworkMessages { get; set; }
        public DbSet<VibrationCommand> VibrationCommands { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
                
                entity.HasMany(e => e.Devices)
                      .WithOne(e => e.User)
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // VibrationDevice configuration
            modelBuilder.Entity<VibrationDevice>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Type).HasConversion<string>();
                entity.Property(e => e.Role).HasConversion<string>();
                entity.Property(e => e.ConnectionType).HasConversion<string>();
                entity.Property(e => e.Status).HasConversion<string>();
                
                entity.HasIndex(e => e.BluetoothIdentifier);
                entity.HasIndex(e => e.IpAddress);
            });

            // VibrationSettings configuration
            modelBuilder.Entity<VibrationSettings>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Pattern).HasConversion<string>();
                
                entity.HasOne(e => e.Device)
                      .WithMany()
                      .HasForeignKey(e => e.DeviceId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // TemperatureReading configuration
            modelBuilder.Entity<TemperatureReading>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.DeviceId, e.Timestamp });
                
                entity.HasOne(e => e.Device)
                      .WithMany()
                      .HasForeignKey(e => e.DeviceId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // NetworkMessage configuration
            modelBuilder.Entity<NetworkMessage>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Type).HasConversion<string>();
                entity.HasIndex(e => e.Timestamp);
            });

            // VibrationCommand configuration
            modelBuilder.Entity<VibrationCommand>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Pattern).HasConversion<string>();
                entity.HasIndex(e => e.CreatedAt);
                entity.HasIndex(e => e.TargetDeviceId);
            });

            // Seed data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Seed a demo user
            var demoUserId = Guid.Parse("11111111-1111-1111-1111-111111111111");
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    Id = demoUserId,
                    Username = "demo",
                    Email = "demo@vibme.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("demo123"),
                    CreatedAt = DateTime.UtcNow,
                    LastLoginAt = DateTime.UtcNow
                }
            );

            // Seed demo devices
            var device1Id = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var device2Id = Guid.Parse("33333333-3333-3333-3333-333333333333");

            modelBuilder.Entity<VibrationDevice>().HasData(
                new VibrationDevice
                {
                    Id = device1Id,
                    Name = "My iPhone",
                    Type = DeviceType.iOSPhone,
                    Role = DeviceRole.Controller,
                    ConnectionType = ConnectionType.Local,
                    Status = DeviceStatus.Connected,
                    Temperature = 25.0,
                    LastSeen = DateTime.UtcNow,
                    BatteryLevel = 85.0,
                    UserId = demoUserId
                },
                new VibrationDevice
                {
                    Id = device2Id,
                    Name = "Partner's Device",
                    Type = DeviceType.AndroidPhone,
                    Role = DeviceRole.Target,
                    ConnectionType = ConnectionType.Online,
                    Status = DeviceStatus.Disconnected,
                    Temperature = 22.0,
                    LastSeen = DateTime.UtcNow.AddMinutes(-10),
                    BatteryLevel = 67.0,
                    UserId = demoUserId
                }
            );

            // Seed vibration settings
            modelBuilder.Entity<VibrationSettings>().HasData(
                new VibrationSettings
                {
                    Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                    Pattern = VibrationPattern.Pulse,
                    Intensity = 0.7,
                    Duration = 1.5,
                    IntervalBetweenPatterns = 0.5,
                    IsRepeating = false,
                    DeviceId = device2Id
                }
            );
        }
    }
}