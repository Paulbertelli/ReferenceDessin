using ReferenceDessin.Application.Pinterest.ListPinterestBoards;
using ReferenceDessin.Application.Pinterest.ListPinterestBoardSections;

namespace ReferenceDessin.Application.Pinterest;

public interface IPinterestCatalog
{
    Task<IReadOnlyCollection<PinterestBoard>> GetBoardsAsync(
        CancellationToken cancellationToken = default);
    
    Task<IReadOnlyCollection<PinterestBoardSection>>
        GetBoardSectionsAsync(
            string boardId,
            CancellationToken cancellationToken = default);
    
    Task<IReadOnlyCollection<PinterestPin>> GetBoardPinsAsync(
        string boardId,
        string? sectionId = null,
        CancellationToken cancellationToken = default);
}