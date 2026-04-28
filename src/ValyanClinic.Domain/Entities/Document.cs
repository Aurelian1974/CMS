namespace ValyanClinic.Domain.Entities;

/// <summary>
/// Document atașat (radiografie, rezultat extern etc.). Storage minimal in-DB sau path către disk/blob.
/// </summary>
public sealed class Document
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long FileSize { get; init; }
    public string? StoragePath { get; init; }
    public byte[]? FileBytes { get; init; }
    public bool IsDeleted { get; init; }
    public DateTime CreatedAt { get; init; }
    public Guid CreatedBy { get; init; }
}
