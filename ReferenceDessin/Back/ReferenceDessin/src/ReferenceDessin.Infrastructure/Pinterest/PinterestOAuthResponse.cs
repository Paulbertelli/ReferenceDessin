using System.Text.Json.Serialization;

namespace ReferenceDessin.Infrastructure.Pinterest;

internal sealed record PinterestOAuthResponse(
    [property: JsonPropertyName("access_token")]
    string AccessToken,

    [property: JsonPropertyName("expires_in")]
    int ExpiresIn,

    [property: JsonPropertyName("token_type")]
    string TokenType);