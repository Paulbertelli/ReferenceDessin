namespace ReferenceDessin.Infrastructure.Pexels;

/// <summary>
/// Regrouper les paramètres de configuration de Pexels.
/// </summary>
public sealed class PexelsOptions
{
    public const string SectionName = "Pexels";

    public string BaseUrl { get; init; } = "https://api.pexels.com/v1/";

    public string ApiKey { get; init; } = string.Empty;
}