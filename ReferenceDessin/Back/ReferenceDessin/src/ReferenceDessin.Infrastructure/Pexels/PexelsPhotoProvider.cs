using System.Net.Http.Json;
using ReferenceDessin.Application.Photos;

namespace ReferenceDessin.Infrastructure.Pexels;

public sealed class PexelsPhotoProvider(HttpClient httpClient)
    : IPhotoProvider
{
    public async Task<IReadOnlyCollection<PhotoReference>> GetPhotosAsync(
        string? query,
        int count,
        CancellationToken cancellationToken = default)
    {
        var endpoint = string.IsNullOrWhiteSpace(query)
            ? $"curated?per_page={count}"
            : $"search?query={Uri.EscapeDataString(query.Trim())}" +
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
            .Select(photo => new PhotoReference(
                photo.Id,
                photo.Sources.Large2X,
                photo.Url,
                photo.Photographer,
                photo.PhotographerUrl,
                photo.Alt,
                photo.AverageColor))
            .ToArray();
    }
}