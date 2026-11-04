using System.Globalization;
using System.Net.Http.Json;
using ReferenceDessin.Application.Photos;

namespace ReferenceDessin.Infrastructure.Pexels;

/// <summary>
/// Communiquer avec l'API Pexels et transformer les réponses.
/// </summary>
public sealed class PexelsClient(HttpClient httpClient, PexelsQuotaTracker quotaTracker) : IPexelsPhotoProvider
{
    public async Task<IReadOnlyCollection<ReferenceImage>> SearchAsync(
        string? searchTerm,
        int count,
        CancellationToken cancellationToken = default)
    {
        // Un résultat déjà en cache ne passe pas par cette méthode.
        // Le blocage est préventif uniquement si le quota mensuel est connu comme épuisé.
        if (quotaTracker.IsExhausted)
        {
            throw new HttpRequestException(
                "Le quota mensuel Pexels est épuisé jusqu'à sa réinitialisation.",
                null,
                System.Net.HttpStatusCode.TooManyRequests);
        }
        
        var endpoint = string.IsNullOrWhiteSpace(searchTerm)
            ? $"curated?per_page={count}"
            : $"search?query={Uri.EscapeDataString(searchTerm.Trim())}" +
              $"&locale=fr-FR&per_page={count}";

        var response = await httpClient.GetAsync(
            endpoint,
            cancellationToken);

        response.EnsureSuccessStatusCode();
        
        // Pexels n'envoie ces en-têtes que sur les réponses réussies (2xx).
        quotaTracker.Observe(response.Headers);

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
                image.Id.ToString(
                    CultureInfo.InvariantCulture),
                image.Sources.Large2X,
                "Pexels",
                image.Url,
                image.Photographer,
                image.PhotographerUrl,
                image.Alt,
                image.AverageColor))
            .ToArray();
    }
}