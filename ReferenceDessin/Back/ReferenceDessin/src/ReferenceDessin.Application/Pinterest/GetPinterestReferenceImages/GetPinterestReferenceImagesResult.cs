using ReferenceDessin.Application.Photos;

namespace ReferenceDessin.Application.Pinterest.GetPinterestReferenceImages;

public enum GetPinterestReferenceImagesError
{
    None,
    InvalidBoardId
}

public sealed record GetPinterestReferenceImagesResult(
    IReadOnlyCollection<ReferenceImage> Images,
    GetPinterestReferenceImagesError Error)
{
    public bool IsSuccess =>
        Error == GetPinterestReferenceImagesError.None;

    public static GetPinterestReferenceImagesResult Success(
        IReadOnlyCollection<ReferenceImage> images)
    {
        return new GetPinterestReferenceImagesResult(
            images,
            GetPinterestReferenceImagesError.None);
    }

    public static GetPinterestReferenceImagesResult Failure(
        GetPinterestReferenceImagesError error)
    {
        return new GetPinterestReferenceImagesResult(
            [],
            error);
    }
}