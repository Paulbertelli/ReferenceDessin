namespace ReferenceDessin.Application.Pinterest.ListPinterestBoards;

public sealed class ListPinterestBoardsHandler(
    IPinterestCatalog pinterestCatalog)
{
    public Task<IReadOnlyCollection<PinterestBoard>> HandleAsync(
        CancellationToken cancellationToken = default)
    {
        return pinterestCatalog.GetBoardsAsync(
            cancellationToken);
    }
}