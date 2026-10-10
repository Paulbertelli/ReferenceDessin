using System.Net.Http.Json;
using ReferenceDessin.Application.Pinterest;
using ReferenceDessin.Application.Pinterest.ListPinterestBoards;

namespace ReferenceDessin.Infrastructure.Pinterest;

public sealed class PinterestClient(HttpClient httpClient)
    : IPinterestCatalog
{
    private const int PageSize = 100;

    public async Task<IReadOnlyCollection<PinterestBoard>>
        GetBoardsAsync(
            CancellationToken cancellationToken = default)
    {
        var boards = new List<PinterestBoard>();
        string? bookmark = null;

        do
        {
            var endpoint = BuildBoardsEndpoint(bookmark);

            using var response = await httpClient.GetAsync(
                endpoint,
                cancellationToken);

            response.EnsureSuccessStatusCode();

            var page = await response.Content
                .ReadFromJsonAsync<PinterestBoardsResponse>(
                    cancellationToken);

            if (page is null)
            {
                break;
            }

            boards.AddRange(
                page.Items.Select(board =>
                    new PinterestBoard(
                        Id: board.Id,
                        Name: board.Name,
                        Description: board.Description)));

            bookmark = string.IsNullOrWhiteSpace(page.Bookmark)
                ? null
                : page.Bookmark;
        }
        while (bookmark is not null);

        return boards;
    }

    private static string BuildBoardsEndpoint(
        string? bookmark)
    {
        var endpoint = $"boards?page_size={PageSize}";

        if (bookmark is null)
        {
            return endpoint;
        }

        return endpoint +
               $"&bookmark={Uri.EscapeDataString(bookmark)}";
    }
}