namespace ReferenceDessin.Application.Pinterest.ListPinterestBoards;

public sealed class ListPinterestBoardsHandler(
    IPinterestCatalog pinterestCatalog)
{
    public async Task<IReadOnlyCollection<PinterestBoard>> HandleAsync(
        CancellationToken cancellationToken = default)
    {
        var boards =
            await pinterestCatalog.GetBoardsAsync(
                cancellationToken);

        var enrichedBoards =
            new List<PinterestBoard>(boards.Count);

        foreach (var board in boards)
        {
            var sections =
                await pinterestCatalog
                    .GetBoardSectionsAsync(
                        board.Id,
                        cancellationToken);

            enrichedBoards.Add(
                board with
                {
                    SectionCount = sections.Count
                });
        }

        return enrichedBoards;
    }
}