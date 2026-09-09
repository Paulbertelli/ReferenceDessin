using System.Text.Json.Serialization;

namespace ReferenceDessin.Infrastructure.Pexels;

internal sealed record PexelsSearchResponse(
    [property: JsonPropertyName("photos")]
    IReadOnlyCollection<PexelsPhoto> Photos);

internal sealed record PexelsPhoto(
    [property: JsonPropertyName("id")]
    long Id,

    [property: JsonPropertyName("url")]
    string Url,

    [property: JsonPropertyName("photographer")]
    string Photographer,

    [property: JsonPropertyName("photographer_url")]
    string PhotographerUrl,

    [property: JsonPropertyName("avg_color")]
    string AverageColor,

    [property: JsonPropertyName("alt")]
    string Alt,

    [property: JsonPropertyName("src")]
    PexelsSources Sources);

internal sealed record PexelsSources(
    [property: JsonPropertyName("large2x")]
    string Large2X);