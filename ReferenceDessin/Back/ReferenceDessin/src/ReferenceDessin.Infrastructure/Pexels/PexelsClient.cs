using System.Globalization;
using System.Net.Http.Json;
using ReferenceDessin.Application.Photos;

namespace ReferenceDessin.Infrastructure.Pexels;

public sealed class PexelsClient(HttpClient httpClient) : IPexelsPhotoProvider
{
    public async Task<IReadOnlyCollection<ReferenceImage>> SearchAsync(
        string? searchTerm,
        int count,
        CancellationToken cancellationToken = default)
    {
        var endpoint = string.IsNullOrWhiteSpace(searchTerm)
            ? $"curated?per_page={count}"
            : $"search?query={Uri.EscapeDataString(searchTerm.Trim())}" +
              $"&locale=fr-FR&per_page={count}";

        var response = await httpClient.GetAsync(
            endpoint,
            cancellationToken);

        response.EnsureSuccessStatusCode();

        var result =
            await response.Content.ReadFromJsonAsync<PexelsSearchResponse>(
                cancellationToken);

        if (result is null)
        {
            return [];
        }

        return result.Photos
            .OrderBy(_ => Random.Shared.Next())
            .Select(image => new ReferenceImage(
                ExternalId: image.Id.ToString(
                    CultureInfo.InvariantCulture),
                ImageUrl: image.Sources.Large2X,
                SourceName: "Pexels",
                OriginalUrl: image.Url,
                AuthorName: image.Photographer,
                AuthorUrl: image.PhotographerUrl,
                Description: image.Alt,
                AverageColor: image.AverageColor))
            .ToArray();
    }
}