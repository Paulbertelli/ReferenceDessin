namespace ReferenceDessin.Infrastructure.Pinterest;

public sealed class PinterestOptions
{
    public const string SectionName = "Pinterest";
    public bool Enabled { get; init; }
    public string BaseUrl { get; init; } = "https://api.pinterest.com/v5/";
    public string OAuthUrl { get; init; } = "https://api.pinterest.com/v5/oauth/token";
    public string AppId { get; init; } = string.Empty;
    public string AppSecret { get; init; } = string.Empty;
}