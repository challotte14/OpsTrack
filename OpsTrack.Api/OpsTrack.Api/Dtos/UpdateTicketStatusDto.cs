namespace OpsTrack.Api.DTOs;

public class UpdateTicketStatusDto
{
    public string Status { get; set; } = string.Empty;

    public string PerformedBy { get; set; } = string.Empty;
}