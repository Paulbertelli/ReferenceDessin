using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ReferenceDessin.Infrastructure.Identity;

namespace ReferenceDessin.Infrastructure.Persistence;

public sealed class ReferenceDessinDbContext(DbContextOptions<ReferenceDessinDbContext> options) 
    : IdentityUserContext<ApplicationUser, Guid>(options)
{
    protected override void OnModelCreating(
        ModelBuilder builder)
    {
        base.OnModelCreating(builder);  
        
        builder.Entity<ApplicationUser>(entite =>
        {
            entite.Property(user => user.DisplayName)
                .HasMaxLength(100);
            
            entite.Property(user => user.CreatedAtUtc)
                .IsRequired();
        });
    }
}