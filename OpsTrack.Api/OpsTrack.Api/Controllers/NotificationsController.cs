using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpsTrack.Api.Data;

namespace OpsTrack.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly OpsTrackDbContext _context;

    public NotificationsController(OpsTrackDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        var userEmail = User.FindFirstValue(ClaimTypes.Email);

        var notifications = await _context.Notifications
            .Where(notification =>
                notification.UserEmail == null ||
                notification.UserEmail == userEmail)
            .OrderByDescending(notification => notification.CreatedAt)
            .Take(20)
            .ToListAsync();

        return Ok(notifications);
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userEmail = User.FindFirstValue(ClaimTypes.Email);

        var count = await _context.Notifications
            .CountAsync(notification =>
                !notification.IsRead &&
                (notification.UserEmail == null ||
                 notification.UserEmail == userEmail));

        return Ok(new { count });
    }

    [HttpPost("{id:int}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var userEmail = User.FindFirstValue(ClaimTypes.Email);

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(item =>
                item.Id == id &&
                (item.UserEmail == null || item.UserEmail == userEmail));

        if (notification == null)
        {
            return NotFound();
        }

        notification.IsRead = true;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("mark-all-read")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userEmail = User.FindFirstValue(ClaimTypes.Email);

        var notifications = await _context.Notifications
            .Where(notification =>
                !notification.IsRead &&
                (notification.UserEmail == null ||
                 notification.UserEmail == userEmail))
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }
}