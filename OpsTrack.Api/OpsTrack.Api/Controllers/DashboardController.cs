using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpsTrack.Api.Data;

namespace OpsTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly OpsTrackDbContext _context;

    public DashboardController(OpsTrackDbContext context)
    {
        _context = context;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var totalTickets = await _context.Tickets.CountAsync();

        var openTickets = await _context.Tickets
            .CountAsync(ticket => ticket.Status != "Resolved" && ticket.Status != "Closed");

        var criticalTickets = await _context.Tickets
            .CountAsync(ticket => ticket.Priority == "Critical");

        var resolvedTickets = await _context.Tickets
            .CountAsync(ticket => ticket.Status == "Resolved");

        var unassignedTickets = await _context.Tickets
            .CountAsync(ticket => string.IsNullOrWhiteSpace(ticket.AssignedTo));

        var summary = new
        {
            totalTickets,
            openTickets,
            criticalTickets,
            resolvedTickets,
            unassignedTickets
        };

        return Ok(summary);
    }
}