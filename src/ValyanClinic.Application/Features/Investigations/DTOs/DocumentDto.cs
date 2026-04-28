namespace ValyanClinic.Application.Features.Investigations.DTOs;

public sealed class DocumentDto
{
    public Guid Id { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long FileSize { get; init; }
}

public sealed class DocumentDownloadDto
{
    public Guid Id { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public byte[]? FileBytes { get; init; }
    public string? StoragePath { get; init; }
}
