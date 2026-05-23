namespace OpsTrack.Api.DTOs;

public class CreateTicketDto
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string Priority { get; set; } = "Medium";

    public string RequesterName { get; set; } = string.Empty;

    public string Department { get; set; } = string.Empty;

    public string? AssignedTo { get; set; }
}