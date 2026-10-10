using System.Text.Json.Serialization;

namespace ReferenceDessin.Infrastructure.Pinterest;

internal sealed record PinterestBoardsResponse(
    [property: JsonPropertyName("items")]
    IReadOnlyCollection<PinterestBoardResponse> Items,

    [property: JsonPropertyName("bookmark")]
    string? Bookmark);

internal sealed record PinterestBoardResponse(
    [property: JsonPropertyName("id")]
    string Id,

    [property: JsonPropertyName("name")]
    string Name,

    [property: JsonPropertyName("description")]
    string? Description);