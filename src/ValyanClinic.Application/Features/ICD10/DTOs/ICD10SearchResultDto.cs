namespace ValyanClinic.Application.Features.ICD10.DTOs;

/// <summary>
/// DTO pentru rezultatele căutării ICD-10.
/// Mapează rezultatul din sp_ICD10_Search.
/// </summary>
public sealed class ICD10SearchResultDto
{
    public Guid ICD10_ID { get; set; }
    public string Code { get; set; } = string.Empty;
    public string FullCode { get; set; } = string.Empty;
    public string ShortDescriptionRo { get; set; } = string.Empty;
    public string? ShortDescriptionEn { get; set; }
    public string? LongDescriptionRo { get; set; }
    public string? LongDescriptionEn { get; set; }
    public string? Category { get; set; }
    public string? Severity { get; set; }
    public bool IsCommon { get; set; }
    public bool IsLeafNode { get; set; }
    public bool IsBillable { get; set; }
    public bool IsTranslated { get; set; }
    public int? ChapterNumber { get; set; }
    public string? ChapterDescription { get; set; }
    public int RelevanceScore { get; set; }
    public bool IsFavorite { get; set; }
}
