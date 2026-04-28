using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Investigations.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

public sealed class DocumentRepository(DapperContext context) : IDocumentRepository
{
    public async Task<Guid> CreateAsync(
        Guid clinicId, string fileName, string contentType, long fileSize,
        string? storagePath, byte[]? fileBytes, Guid createdBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                DocumentProcedures.Create,
                new
                {
                    ClinicId = clinicId,
                    FileName = fileName,
                    ContentType = contentType,
                    FileSize = fileSize,
                    StoragePath = storagePath,
                    FileBytes = fileBytes,
                    CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<DocumentDownloadDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<DocumentDownloadDto>(
            new CommandDefinition(
                DocumentProcedures.GetById,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
