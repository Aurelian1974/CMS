using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Schedule.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

public sealed class ScheduleRepository(DapperContext context) : IScheduleRepository
{
    // ── Clinic Schedule ───────────────────────────────────────────────────────

    public async Task<IEnumerable<ClinicScheduleDto>> GetClinicScheduleAsync(
        Guid clinicId, CancellationToken ct)
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<ClinicScheduleDto>(
            new CommandDefinition(
                ScheduleProcedures.ClinicScheduleGetByClinic,
                new { ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpsertClinicDayAsync(
        Guid clinicId, byte dayOfWeek, bool isOpen,
        string? openTime, string? closeTime,
        Guid userId, CancellationToken ct)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            new CommandDefinition(
                ScheduleProcedures.ClinicScheduleUpsert,
                new
                {
                    ClinicId   = clinicId,
                    DayOfWeek  = dayOfWeek,
                    IsOpen     = isOpen,
                    OpenTime   = openTime,
                    CloseTime  = closeTime,
                    UserId     = userId
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    // ── Doctor Schedule ───────────────────────────────────────────────────────

    public async Task<IEnumerable<DoctorScheduleDto>> GetDoctorScheduleByClinicAsync(
        Guid clinicId, CancellationToken ct)
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<DoctorScheduleDto>(
            new CommandDefinition(
                ScheduleProcedures.DoctorScheduleGetByClinic,
                new { ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<IEnumerable<DoctorDayDto>> GetDoctorScheduleByDoctorAsync(
        Guid doctorId, Guid clinicId, CancellationToken ct)
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<DoctorDayDto>(
            new CommandDefinition(
                ScheduleProcedures.DoctorScheduleGetByDoctor,
                new { DoctorId = doctorId, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpsertDoctorDayAsync(
        Guid clinicId, Guid doctorId, byte dayOfWeek,
        string startTime, string endTime,
        Guid userId, CancellationToken ct)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            new CommandDefinition(
                ScheduleProcedures.DoctorScheduleUpsert,
                new
                {
                    ClinicId  = clinicId,
                    DoctorId  = doctorId,
                    DayOfWeek = dayOfWeek,
                    StartTime = startTime,
                    EndTime   = endTime,
                    UserId    = userId
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task DeleteDoctorDayAsync(
        Guid doctorId, byte dayOfWeek, Guid clinicId, CancellationToken ct)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            new CommandDefinition(
                ScheduleProcedures.DoctorScheduleDelete,
                new { DoctorId = doctorId, DayOfWeek = dayOfWeek, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
