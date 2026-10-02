using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ReferenceDessin.Infrastructure.Identite;

namespace ReferenceDessin.Infrastructure.Persistance;

public sealed class ContexteReferenceDessin(DbContextOptions<ContexteReferenceDessin> options) 
    : IdentityUserContext<Utilisateur, Guid>(options)
{
    protected override void OnModelCreating(
        ModelBuilder constructeur)
    {
        base.OnModelCreating(constructeur);  
        
        constructeur.Entity<Utilisateur>(entite =>
        {
            entite.Property(utilisateur => utilisateur.NomAffiche)
                .HasMaxLength(100);
            
            entite.Property(utilisateur => utilisateur.CreeLeUtc)
                .IsRequired();
        });
    }
}