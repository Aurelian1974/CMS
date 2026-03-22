using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Schedule.DTOs;

namespace ValyanClinic.Application.Features.Schedule.Queries;

// ── Get clinic schedule ───────────────────────────────────────────────────────
public sealed record GetClinicScheduleQuery : IRequest<Result<IEnumerable<ClinicScheduleDto>>>;

public sealed class GetClinicScheduleQueryHandler(IScheduleRepository repo, ICurrentUser currentUser)
    : IRequestHandler<GetClinicScheduleQuery, Result<IEnumerable<ClinicScheduleDto>>>
{
    public async Task<Result<IEnumerable<ClinicScheduleDto>>> Handle(
        GetClinicScheduleQuery request, CancellationToken cancellationToken)
    {
        var data = await repo.GetClinicScheduleAsync(currentUser.ClinicId, cancellationToken);
        return Result<IEnumerable<ClinicScheduleDto>>.Success(data);
    }
}

// ── Get all doctors schedule ──────────────────────────────────────────────────
public sealed record GetDoctorScheduleByClinicQuery : IRequest<Result<IEnumerable<DoctorScheduleDto>>>;

public sealed class GetDoctorScheduleByClinicQueryHandler(IScheduleRepository repo, ICurrentUser currentUser)
    : IRequestHandler<GetDoctorScheduleByClinicQuery, Result<IEnumerable<DoctorScheduleDto>>>
{
    public async Task<Result<IEnumerable<DoctorScheduleDto>>> Handle(
        GetDoctorScheduleByClinicQuery request, CancellationToken cancellationToken)
    {
        var data = await repo.GetDoctorScheduleByClinicAsync(currentUser.ClinicId, cancellationToken);
        return Result<IEnumerable<DoctorScheduleDto>>.Success(data);
    }
}

// ── Get one doctor's schedule ─────────────────────────────────────────────────
public sealed record GetDoctorScheduleQuery(Guid DoctorId) : IRequest<Result<IEnumerable<DoctorDayDto>>>;

public sealed class GetDoctorScheduleQueryHandler(IScheduleRepository repo, ICurrentUser currentUser)
    : IRequestHandler<GetDoctorScheduleQuery, Result<IEnumerable<DoctorDayDto>>>
{
    public async Task<Result<IEnumerable<DoctorDayDto>>> Handle(
        GetDoctorScheduleQuery request, CancellationToken cancellationToken)
    {
        var data = await repo.GetDoctorScheduleByDoctorAsync(request.DoctorId, currentUser.ClinicId, cancellationToken);
        return Result<IEnumerable<DoctorDayDto>>.Success(data);
    }
}
