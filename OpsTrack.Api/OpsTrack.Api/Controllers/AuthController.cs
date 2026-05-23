using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using OpsTrack.Api.DTOs;
using OpsTrack.Api.Models;

namespace OpsTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IConfiguration _configuration;

    private static readonly string[] AllowedRoles =
    [
        "Admin",
        "SupportAgent",
        "Employee"
    ];

    public AuthController(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest("Full name is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest("Email is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Password is required.");
        }

        var requestedRole = string.IsNullOrWhiteSpace(request.Role)
            ? "Employee"
            : request.Role;

        if (!AllowedRoles.Contains(requestedRole))
        {
            return BadRequest("Invalid role.");
        }

        foreach (var role in AllowedRoles)
        {
            if (!await _roleManager.RoleExistsAsync(role))
            {
                await _roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        var existingUser = await _userManager.FindByEmailAsync(request.Email);

        if (existingUser != null)
        {
            return BadRequest("A user with this email already exists.");
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        await _userManager.AddToRoleAsync(user, requestedRole);

        return Ok(new
        {
            message = "User registered successfully.",
            user.FullName,
            user.Email,
            role = requestedRole
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest("Email is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Password is required.");
        }

        var user = await _userManager.FindByEmailAsync(request.Email);

        if (user == null)
        {
            return Unauthorized("Invalid email or password.");
        }

        var passwordValid = await _userManager.CheckPasswordAsync(user, request.Password);

        if (!passwordValid)
        {
            return Unauthorized("Invalid email or password.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? "Employee";

        var token = GenerateJwtToken(user, roles);

        return Ok(new
        {
            token,
            user.FullName,
            user.Email,
            role
        });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByIdAsync(userId);

        if (user == null)
        {
            return Unauthorized();
        }

        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? "Employee";

        return Ok(new
        {
            user.FullName,
            user.Email,
            role
        });
    }

    private string GenerateJwtToken(ApplicationUser user, IList<string> roles)
    {
        var issuer = _configuration["Jwt:Issuer"];
        var audience = _configuration["Jwt:Audience"];
        var key = _configuration["Jwt:Key"];
        var expiryMinutes = int.Parse(_configuration["Jwt:ExpiryMinutes"] ?? "120");

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.Email ?? string.Empty),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new("fullName", user.FullName)
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key!));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(UpdateProfileDto request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest("Full name is required.");
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByIdAsync(userId);

        if (user == null)
        {
            return Unauthorized();
        }

        user.FullName = request.FullName.Trim();

        var result = await _userManager.UpdateAsync(user);

        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? "Employee";

        return Ok(new
        {
            user.FullName,
            user.Email,
            role
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("support-agents")]
    public async Task<IActionResult> GetSupportAgents()
    {
        var users = await _userManager.GetUsersInRoleAsync("SupportAgent");

        var agents = users
            .OrderBy(user => user.FullName)
            .Select(user => new
            {
                user.FullName,
                user.Email
            });

        return Ok(agents);
    }
}