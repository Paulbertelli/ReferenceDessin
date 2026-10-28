using Microsoft.AspNetCore.Identity;

namespace ReferenceDessin.Infrastructure.Identity;

public sealed class ApplicationUser: IdentityUser<Guid>
{
    public string DisplayName { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}