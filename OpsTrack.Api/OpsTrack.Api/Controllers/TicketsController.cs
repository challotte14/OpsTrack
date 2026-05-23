using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpsTrack.Api.Data;
using OpsTrack.Api.DTOs;
using OpsTrack.Api.Models;

namespace OpsTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TicketsController : ControllerBase
{
    private readonly OpsTrackDbContext _context;

    public TicketsController(OpsTrackDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<Ticket>>> GetTickets(
    [FromQuery] string? status,
    [FromQuery] string? priority,
    [FromQuery] string? assignedTo,
    [FromQuery] string? search)
    {
        var query = _context.Tickets.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(ticket => ticket.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(priority))
        {
            query = query.Where(ticket => ticket.Priority == priority);
        }

        if (!string.IsNullOrWhiteSpace(assignedTo))
        {
            query = query.Where(ticket => ticket.AssignedTo == assignedTo);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var cleanedSearch = search.ToLower();

            query = query.Where(ticket =>
                ticket.TicketNumber.ToLower().Contains(cleanedSearch) ||
                ticket.Title.ToLower().Contains(cleanedSearch) ||
                ticket.Description.ToLower().Contains(cleanedSearch) ||
                ticket.Category.ToLower().Contains(cleanedSearch) ||
                ticket.RequesterName.ToLower().Contains(cleanedSearch) ||
                ticket.Department.ToLower().Contains(cleanedSearch) ||
                (ticket.AssignedTo != null && ticket.AssignedTo.ToLower().Contains(cleanedSearch)));
        }

        var tickets = await query
            .OrderByDescending(ticket => ticket.CreatedAt)
            .ToListAsync();

        return Ok(tickets);
    }
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Ticket>> GetTicket(int id)
    {
        var ticket = await _context.Tickets
            .Include(ticket => ticket.Comments)
            .Include(ticket => ticket.ActivityLogs)
            .FirstOrDefaultAsync(ticket => ticket.Id == id);

        if (ticket == null)
        {
            return NotFound();
        }

        return Ok(ticket);
    }

    [HttpPost]
    public async Task<ActionResult<Ticket>> CreateTicket(CreateTicketDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest("Ticket title is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Description))
        {
            return BadRequest("Ticket description is required.");
        }

        var ticket = new Ticket
        {
            TicketNumber = $"INC-{DateTime.UtcNow:yyyyMMddHHmmss}",
            Title = request.Title,
            Description = request.Description,
            Category = request.Category,
            Priority = string.IsNullOrWhiteSpace(request.Priority) ? "Medium" : request.Priority,
            Status = "New",
            RequesterName = request.RequesterName,
            Department = request.Department,
            AssignedTo = request.AssignedTo,
            CreatedAt = DateTime.UtcNow
        };

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();
        var activityLog = new TicketActivityLog
        {
            TicketId = ticket.Id,
            Action = "Ticket Created",
            PerformedBy = string.IsNullOrWhiteSpace(ticket.RequesterName)
        ? "System User"
        : ticket.RequesterName,
            NewValue = ticket.Status,
            CreatedAt = DateTime.UtcNow
        };

        _context.TicketActivityLogs.Add(activityLog);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTicket), new { id = ticket.Id }, ticket);
    }
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateTicket(int id, UpdateTicketDto request)
    {
        var ticket = await _context.Tickets.FindAsync(id);

        if (ticket == null)
        {
            return NotFound();
        }

        ticket.Title = request.Title;
        ticket.Description = request.Description;
        ticket.Category = request.Category;
        ticket.Priority = request.Priority;
        ticket.Status = request.Status;
        ticket.RequesterName = request.RequesterName;
        ticket.Department = request.Department;
        ticket.AssignedTo = request.AssignedTo;
        ticket.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteTicket(int id)
    {
        var ticket = await _context.Tickets.FindAsync(id);

        if (ticket == null)
        {
            return NotFound();
        }

        _context.Tickets.Remove(ticket);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id:int}/comments")]
    public async Task<IActionResult> AddComment(int id, AddTicketCommentDto request)
    {
        var ticket = await _context.Tickets.FindAsync(id);

        if (ticket == null)
        {
            return NotFound();
        }

        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest("Comment message is required.");
        }

        var comment = new TicketComment
        {
            TicketId = ticket.Id,
            AuthorName = string.IsNullOrWhiteSpace(request.AuthorName)
                ? "System User"
                : request.AuthorName,
            Message = request.Message,
            CreatedAt = DateTime.UtcNow
        };

        var activityLog = new TicketActivityLog
        {
            TicketId = ticket.Id,
            Action = "Comment Added",
            PerformedBy = comment.AuthorName,
            NewValue = request.Message,
            CreatedAt = DateTime.UtcNow
        };

        ticket.UpdatedAt = DateTime.UtcNow;

        _context.TicketComments.Add(comment);
        _context.TicketActivityLogs.Add(activityLog);

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, UpdateTicketStatusDto request)
    {
        var ticket = await _context.Tickets.FindAsync(id);

        if (ticket == null)
        {
            return NotFound();
        }

        if (string.IsNullOrWhiteSpace(request.Status))
        {
            return BadRequest("Status is required.");
        }

        var oldStatus = ticket.Status;

        ticket.Status = request.Status;
        ticket.UpdatedAt = DateTime.UtcNow;

        var activityLog = new TicketActivityLog
        {
            TicketId = ticket.Id,
            Action = "Status Updated",
            PerformedBy = string.IsNullOrWhiteSpace(request.PerformedBy)
                ? "System User"
                : request.PerformedBy,
            OldValue = oldStatus,
            NewValue = request.Status,
            CreatedAt = DateTime.UtcNow
        };

        _context.TicketActivityLogs.Add(activityLog);

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id:int}/assign")]
    public async Task<IActionResult> AssignTicket(int id, AssignTicketDto request)
    {
        var ticket = await _context.Tickets.FindAsync(id);

        if (ticket == null)
        {
            return NotFound();
        }

        if (string.IsNullOrWhiteSpace(request.AssignedTo))
        {
            return BadRequest("Assigned user is required.");
        }

        var oldAssignee = ticket.AssignedTo;

        ticket.AssignedTo = request.AssignedTo;
        ticket.UpdatedAt = DateTime.UtcNow;

        var activityLog = new TicketActivityLog
        {
            TicketId = ticket.Id,
            Action = "Ticket Assigned",
            PerformedBy = string.IsNullOrWhiteSpace(request.PerformedBy)
                ? "System User"
                : request.PerformedBy,
            OldValue = oldAssignee,
            NewValue = request.AssignedTo,
            CreatedAt = DateTime.UtcNow
        };

        _context.TicketActivityLogs.Add(activityLog);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}