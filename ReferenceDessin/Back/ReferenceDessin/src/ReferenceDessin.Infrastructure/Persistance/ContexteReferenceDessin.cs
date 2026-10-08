using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ReferenceDessin.Infrastructure.Identity;

namespace ReferenceDessin.Infrastructure.Persistance;

public sealed class ContexteReferenceDessin(DbContextOptions<ContexteReferenceDessin> options) 
    : IdentityUserContext<ApplicationUser, Guid>(options)
{
    protected override void OnModelCreating(
        ModelBuilder constructeur)
    {
        base.OnModelCreating(constructeur);  
        
        constructeur.Entity<ApplicationUser>(entite =>
        {
            entite.Property(utilisateur => utilisateur.NomAffiche)
                .HasMaxLength(100);
            
            entite.Property(utilisateur => utilisateur.CreeLeUtc)
                .IsRequired();
        });
    }
}