using ReferenceDessin.Application.Photos;

namespace ReferenceDessin.Application.Pinterest.GetPinterestReferenceImages;

public sealed class GetPinterestReferenceImagesHandler(
    IPinterestCatalog pinterestCatalog)
{
    public async Task<GetPinterestReferenceImagesResult> HandleAsync(
        GetPinterestReferenceImagesQuery query,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query.BoardId))
        {
            return GetPinterestReferenceImagesResult.Failure(
                GetPinterestReferenceImagesError.InvalidBoardId);
        }

        var boardId = query.BoardId.Trim();

        if (query.MaximumCount is <= 0 or > 4)
        {
            return GetPinterestReferenceImagesResult.Failure(GetPinterestReferenceImagesError.InvalidCount);
        }

        var sectionId =
            string.IsNullOrWhiteSpace(query.SectionId)
                ? null
                : query.SectionId.Trim();

        var pins = await pinterestCatalog.GetBoardPinsAsync(
            boardId,
            sectionId,
            maximumCount: query.MaximumCount,
            cancellationToken);

        var images = pins
            .Select(pin => new ReferenceImage(
                pin.Id,
                pin.ImageUrl,
                "Pinterest",
                pin.OriginalUrl,
                null,
                null,
                GetDescription(pin),
                null))
            .ToArray();

        return GetPinterestReferenceImagesResult.Success(images);
    }

    private static string GetDescription(PinterestPin pin)
    {
        if (!string.IsNullOrWhiteSpace(pin.Description))
        {
            return pin.Description.Trim();
        }

        if (!string.IsNullOrWhiteSpace(pin.Title))
        {
            return pin.Title.Trim();
        }

        return string.Empty;
    }
}