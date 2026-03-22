using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Appointments.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

/// <summary>Repository Dapper pentru programări (exclusiv prin Stored Procedures).</summary>
public sealed class AppointmentRepository(DapperContext context) : IAppointmentRepository
{
    public async Task<AppointmentPagedResult> GetPagedAsync(
        Guid clinicId, string? search, Guid? doctorId, Guid? statusId,
        DateTime? dateFrom, DateTime? dateTo,
        int page, int pageSize, string sortBy, string sortDir,
        CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                AppointmentProcedures.GetPaged,
                new
                {
                    ClinicId = clinicId,
                    Search = search,
                    DoctorId = doctorId,
                    StatusId = statusId,
                    DateFrom = dateFrom,
                    DateTo = dateTo,
                    Page = page,
                    PageSize = pageSize,
                    SortBy = sortBy,
                    SortDir = sortDir
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        // Result set 1: rânduri paginate
        var items = (await multi.ReadAsync<AppointmentListDto>()).ToList();
        // Result set 2: total count
        var totalCount = await multi.ReadSingleAsync<int>();
        // Result set 3: statistici
        var stats = await multi.ReadSingleAsync<AppointmentStatsDto>();

        return new AppointmentPagedResult(
            new PagedResult<AppointmentListDto>(items, totalCount, page, pageSize),
            stats);
    }

    public async Task<AppointmentDetailDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<AppointmentDetailDto>(
            new CommandDefinition(
                AppointmentProcedures.GetById,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<IEnumerable<AppointmentSchedulerDto>> GetForSchedulerAsync(
        Guid clinicId, DateTime dateFrom, DateTime dateTo, Guid? doctorId,
        CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryAsync<AppointmentSchedulerDto>(
            new CommandDefinition(
                AppointmentProcedures.GetByDoctor,
                new
                {
                    ClinicId = clinicId,
                    DateFrom = dateFrom,
                    DateTo = dateTo,
                    DoctorId = doctorId
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<Guid> CreateAsync(
        Guid clinicId, Guid patientId, Guid doctorId,
        DateTime startTime, DateTime endTime,
        Guid? statusId, string? notes,
        Guid createdBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                AppointmentProcedures.Create,
                new
                {
                    ClinicId = clinicId,
                    PatientId = patientId,
                    DoctorId = doctorId,
                    StartTime = startTime,
                    EndTime = endTime,
                    StatusId = statusId,
                    Notes = notes,
                    CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateAsync(
        Guid id, Guid clinicId, Guid patientId, Guid doctorId,
        DateTime startTime, DateTime endTime,
        Guid? statusId, string? notes,
        Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                AppointmentProcedures.Update,
                new
                {
                    Id = id,
                    ClinicId = clinicId,
                    PatientId = patientId,
                    DoctorId = doctorId,
                    StartTime = startTime,
                    EndTime = endTime,
                    StatusId = statusId,
                    Notes = notes,
                    UpdatedBy = updatedBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateStatusAsync(Guid id, Guid clinicId, Guid statusId, Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                AppointmentProcedures.UpdateStatus,
                new
                {
                    Id = id,
                    ClinicId = clinicId,
                    StatusId = statusId,
                    UpdatedBy = updatedBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task DeleteAsync(Guid id, Guid clinicId, Guid deletedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                AppointmentProcedures.Delete,
                new
                {
                    Id = id,
                    ClinicId = clinicId,
                    DeletedBy = deletedBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
