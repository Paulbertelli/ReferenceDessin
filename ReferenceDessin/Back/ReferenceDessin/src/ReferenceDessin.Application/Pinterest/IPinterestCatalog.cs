using ReferenceDessin.Application.Pinterest.ListPinterestBoards;

namespace ReferenceDessin.Application.Pinterest;

public interface IPinterestCatalog
{
    Task<IReadOnlyCollection<PinterestBoard>> GetBoardsAsync(
        CancellationToken cancellationToken = default);
}