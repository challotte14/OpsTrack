using System.Text.Json.Serialization;

namespace OpsTrack.Api.Models;

public class TicketComment
{
    public int Id { get; set; }

    public int TicketId { get; set; }

    [JsonIgnore]
    public Ticket Ticket { get; set; } = null!;

    public string AuthorName { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}