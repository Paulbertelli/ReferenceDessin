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

        var sectionId =
            string.IsNullOrWhiteSpace(query.SectionId)
                ? null
                : query.SectionId.Trim();

        var pins = await pinterestCatalog.GetBoardPinsAsync(
            boardId,
            sectionId,
            cancellationToken);

        var images = pins
            .Select(pin => new ReferenceImage(
                ExternalId: pin.Id,
                ImageUrl: pin.ImageUrl,
                SourceName: "Pinterest",
                OriginalUrl: pin.OriginalUrl,
                AuthorName: null,
                AuthorUrl: null,
                Description:
                pin.Description
                ?? pin.Title
                ?? string.Empty,
                AverageColor: null))
            .ToArray();

        return GetPinterestReferenceImagesResult.Success(images);
    }
}