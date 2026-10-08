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
            entite.Property(utilisateur => utilisateur.NomAffiche)
                .HasMaxLength(100);
            
            entite.Property(utilisateur => utilisateur.CreeLeUtc)
                .IsRequired();
        });
    }
}