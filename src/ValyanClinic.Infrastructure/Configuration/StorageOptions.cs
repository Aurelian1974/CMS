namespace ValyanClinic.Infrastructure.Configuration;

/// <summary>
/// Opțiuni pentru stocarea fișierelor medicale pe filesystem.
/// </summary>
public sealed class StorageOptions
{
    public const string SectionName = "Storage";

    public string BasePath            { get; init; } = string.Empty;
    public long MaxFileSizeBytes      { get; init; } = 10_485_760;
    public string[] AllowedExtensions { get; init; } = [".pdf", ".jpg", ".jpeg", ".png"];
}
