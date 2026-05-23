using Microsoft.EntityFrameworkCore;
using OpsTrack.Api.Models;

namespace OpsTrack.Api.Data;

public class OpsTrackDbContext : DbContext
{
    public OpsTrackDbContext(DbContextOptions<OpsTrackDbContext> options)
        : base(options)
    {
    }

    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<TicketComment> TicketComments => Set<TicketComment>();
    public DbSet<TicketActivityLog> TicketActivityLogs => Set<TicketActivityLog>();
}