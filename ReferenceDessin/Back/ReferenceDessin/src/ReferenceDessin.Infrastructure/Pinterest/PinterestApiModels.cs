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
    
internal sealed record PinterestBoardSectionsResponse(
    [property: JsonPropertyName("items")]
    IReadOnlyCollection<PinterestBoardSectionResponse> Items,

    [property: JsonPropertyName("bookmark")]
    string? Bookmark);

internal sealed record PinterestBoardSectionResponse(
    [property: JsonPropertyName("id")]
    string Id,

    [property: JsonPropertyName("name")]
    string Name);
    
internal sealed record PinterestPinsResponse(
    [property: JsonPropertyName("items")]
    IReadOnlyCollection<PinterestPinResponse> Items,

    [property: JsonPropertyName("bookmark")]
    string? Bookmark);

internal sealed record PinterestPinResponse(
    [property: JsonPropertyName("id")]
    string Id,

    [property: JsonPropertyName("title")]
    string? Title,

    [property: JsonPropertyName("description")]
    string? Description,

    [property: JsonPropertyName("media")]
    PinterestPinMediaResponse? Media);

internal sealed record PinterestPinMediaResponse(
    [property: JsonPropertyName("images")]
    IReadOnlyDictionary<string, PinterestImageResponse>? Images);

internal sealed record PinterestImageResponse(
    [property: JsonPropertyName("url")]
    string Url,

    [property: JsonPropertyName("width")]
    int Width,

    [property: JsonPropertyName("height")]
    int Height);