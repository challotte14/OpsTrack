namespace OpsTrack.Api.DTOs;

public class AddTicketCommentDto
{
    public string AuthorName { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;
}