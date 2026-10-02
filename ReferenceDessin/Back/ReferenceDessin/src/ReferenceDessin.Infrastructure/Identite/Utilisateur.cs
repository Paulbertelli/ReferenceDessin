using Microsoft.AspNetCore.Identity;

namespace ReferenceDessin.Infrastructure.Identite;

public sealed class Utilisateur: IdentityUser<Guid>
{
    public string NomAffiche { get; set; } = string.Empty;

    public DateTimeOffset CreeLeUtc { get; set; } = DateTimeOffset.UtcNow;
}