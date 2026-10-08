using Microsoft.AspNetCore.Identity;

namespace ReferenceDessin.Infrastructure.Identity;

public sealed class ApplicationUser: IdentityUser<Guid>
{
    public string NomAffiche { get; set; } = string.Empty;

    public DateTimeOffset CreeLeUtc { get; set; } = DateTimeOffset.UtcNow;
}