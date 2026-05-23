namespace OpsTrack.Api.Models;

public class Ticket
{
    public int Id { get; set; }

    public string TicketNumber { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string Priority { get; set; } = "Medium";

    public string Status { get; set; } = "New";

    public string RequesterName { get; set; } = string.Empty;

    public string Department { get; set; } = string.Empty;

    public string? AssignedTo { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
    public List<TicketComment> Comments { get; set; } = new();

    public List<TicketActivityLog> ActivityLogs { get; set; } = new();
}