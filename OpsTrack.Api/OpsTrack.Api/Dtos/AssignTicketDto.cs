namespace OpsTrack.Api.DTOs;

public class AssignTicketDto
{
    public string AssignedTo { get; set; } = string.Empty;

    public string PerformedBy { get; set; } = string.Empty;
}