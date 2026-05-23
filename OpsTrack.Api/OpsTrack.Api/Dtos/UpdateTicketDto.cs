namespace OpsTrack.Api.DTOs;

public class UpdateTicketDto
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string Priority { get; set; } = "Medium";

    public string Status { get; set; } = "New";

    public string RequesterName { get; set; } = string.Empty;

    public string Department { get; set; } = string.Empty;

    public string? AssignedTo { get; set; }
}