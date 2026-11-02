namespace ReferenceDessin.Application.Pinterest
    .ListPinterestBoardSections;

public sealed class ListPinterestBoardSectionsHandler(
    IPinterestCatalog pinterestCatalog)
{
    public async Task<ListPinterestBoardSectionsResult> HandleAsync(
        ListPinterestBoardSectionsQuery query,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query.BoardId))
        {
            return ListPinterestBoardSectionsResult.Failure(
                ListPinterestBoardSectionsError.InvalidBoardId);
        }

        var normalizedBoardId = query.BoardId.Trim();

        var sections =
            await pinterestCatalog.GetBoardSectionsAsync(
                normalizedBoardId,
                cancellationToken);

        var countsBySectionId =
            await pinterestCatalog
                .GetBoardSectionPinCountsAsync(
                    normalizedBoardId,
                    cancellationToken);

        var enrichedSections = sections
            .Select(section =>
                section with
                {
                    ReferenceCount =
                    countsBySectionId.GetValueOrDefault(
                        section.Id)
                })
            .ToArray();

        return ListPinterestBoardSectionsResult.Success(enrichedSections);
    }
}