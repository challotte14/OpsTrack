using Microsoft.AspNetCore.Identity;

namespace OpsTrack.Api.Models;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
}