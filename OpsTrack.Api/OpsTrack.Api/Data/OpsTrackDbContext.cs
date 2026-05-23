using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using OpsTrack.Api.Models;

namespace OpsTrack.Api.Data;

public class OpsTrackDbContext : IdentityDbContext<ApplicationUser>
{
    public OpsTrackDbContext(DbContextOptions<OpsTrackDbContext> options)
        : base(options)
    {
    }

    public DbSet<Ticket> Tickets => Set<Ticket>();

    public DbSet<TicketComment> TicketComments => Set<TicketComment>();

    public DbSet<TicketActivityLog> TicketActivityLogs => Set<TicketActivityLog>();
    public DbSet<Notification> Notifications => Set<Notification>();
}