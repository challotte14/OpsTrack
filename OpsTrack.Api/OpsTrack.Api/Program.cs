using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OpsTrack.Api.Data;
using OpsTrack.Api.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("DefaultConnection is missing from configuration.");
}

builder.Services.AddDbContext<OpsTrackDbContext>(options =>
    options.UseSqlServer(
        connectionString,
        sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null
            );
        }));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactClient", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "https://localhost:5173",
                "https://dazzling-cactus-06e4d6.netlify.app"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services
    .AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<OpsTrackDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var issuer = builder.Configuration["Jwt:Issuer"];
    var audience = builder.Configuration["Jwt:Audience"];
    var key = builder.Configuration["Jwt:Key"];

    if (string.IsNullOrWhiteSpace(issuer))
    {
        throw new InvalidOperationException("Jwt:Issuer is missing from configuration.");
    }

    if (string.IsNullOrWhiteSpace(audience))
    {
        throw new InvalidOperationException("Jwt:Audience is missing from configuration.");
    }

    if (string.IsNullOrWhiteSpace(key))
    {
        throw new InvalidOperationException("Jwt:Key is missing from configuration.");
    }

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = issuer,
        ValidAudience = audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key))
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.MapGet("/", () => Results.Ok(new
{
    name = "OpsTrack API",
    status = "Running",
    swagger = "/swagger/index.html"
}));

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    app = "OpsTrack.Api",
    time = DateTime.UtcNow
}));

app.MapGet("/db-health", async (OpsTrackDbContext db) =>
{
    var canConnect = await db.Database.CanConnectAsync();

    return Results.Ok(new
    {
        database = canConnect ? "connected" : "not connected",
        time = DateTime.UtcNow
    });
});

// Keep this disabled only if your host's HTTPS is broken.
// But Netlify will eventually need HTTPS API access.
// app.UseHttpsRedirection();

app.UseCors("AllowReactClient");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();