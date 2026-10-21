namespace ReferenceDessin.Application.Pinterest.ListPinterestBoardSections;

public enum ListPinterestBoardSectionsError
{
    None,
    InvalidBoardId
}

public sealed record ListPinterestBoardSectionsResult(
    IReadOnlyCollection<PinterestBoardSection> Sections,
    ListPinterestBoardSectionsError Error)
{
    public bool IsSuccess =>
        Error == ListPinterestBoardSectionsError.None;

    public static ListPinterestBoardSectionsResult Success(
        IReadOnlyCollection<PinterestBoardSection> sections)
    {
        return new ListPinterestBoardSectionsResult(
            sections,
            ListPinterestBoardSectionsError.None);
    }

    public static ListPinterestBoardSectionsResult Failure(
        ListPinterestBoardSectionsError error)
    {
        return new ListPinterestBoardSectionsResult(
            [],
            error);
    }
}