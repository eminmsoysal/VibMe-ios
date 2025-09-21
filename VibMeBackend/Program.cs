using Microsoft.EntityFrameworkCore;
using VibMeBackend.Data;
using VibMeBackend.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add Entity Framework with In-Memory database
builder.Services.AddDbContext<VibMeDbContext>(options =>
    options.UseInMemoryDatabase("VibMeDb"));

// Add SignalR
builder.Services.AddSignalR();

// Add CORS for cross-platform access
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
    
    options.AddPolicy("VibMePolicy", policy =>
    {
        policy.WithOrigins("http://localhost:8081", "exp://192.168.1.100:8081") // Expo dev server
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Ensure database is created and seeded
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<VibMeDbContext>();
    context.Database.EnsureCreated();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Enable CORS
app.UseCors("VibMePolicy");

app.UseAuthorization();

app.MapControllers();

// Map SignalR hub
app.MapHub<VibMeHub>("/vibmehub");

// Add health check endpoint
app.MapGet("/health", () => new
{
    Status = "Healthy",
    Timestamp = DateTime.UtcNow,
    Version = "1.0.0",
    Environment = app.Environment.EnvironmentName
});

app.Run();
