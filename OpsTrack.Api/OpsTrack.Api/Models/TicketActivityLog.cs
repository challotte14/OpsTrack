using System.Text.Json.Serialization;

namespace OpsTrack.Api.Models;

public class TicketActivityLog
{
    public int Id { get; set; }

    public int TicketId { get; set; }

    [JsonIgnore]
    public Ticket Ticket { get; set; } = null!;

    public string Action { get; set; } = string.Empty;

    public string PerformedBy { get; set; } = string.Empty;

    public string? OldValue { get; set; }

    public string? NewValue { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}