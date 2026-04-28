using ValyanClinic.Application.Features.Investigations.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

public interface IDocumentRepository
{
    Task<Guid> CreateAsync(
        Guid clinicId, string fileName, string contentType, long fileSize,
        string? storagePath, byte[]? fileBytes, Guid createdBy, CancellationToken ct);

    Task<DocumentDownloadDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct);
}
