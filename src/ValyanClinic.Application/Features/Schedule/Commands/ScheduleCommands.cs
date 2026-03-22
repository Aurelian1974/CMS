using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Schedule.Commands;

// ── Upsert clinic day ─────────────────────────────────────────────────────────
public sealed record UpsertClinicDayCommand(
    byte DayOfWeek,
    bool IsOpen,
    string? OpenTime,
    string? CloseTime
) : IRequest<Result<bool>>;

public sealed class UpsertClinicDayCommandHandler(IScheduleRepository repo, ICurrentUser currentUser)
    : IRequestHandler<UpsertClinicDayCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(UpsertClinicDayCommand request, CancellationToken cancellationToken)
    {
        await repo.UpsertClinicDayAsync(
            currentUser.ClinicId, request.DayOfWeek, request.IsOpen,
            request.OpenTime, request.CloseTime,
            currentUser.Id, cancellationToken);

        return Result<bool>.Success(true);
    }
}

// ── Upsert doctor day ─────────────────────────────────────────────────────────
public sealed record UpsertDoctorDayCommand(
    Guid DoctorId,
    byte DayOfWeek,
    string StartTime,
    string EndTime
) : IRequest<Result<bool>>;

public sealed class UpsertDoctorDayCommandHandler(IScheduleRepository repo, ICurrentUser currentUser)
    : IRequestHandler<UpsertDoctorDayCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(UpsertDoctorDayCommand request, CancellationToken cancellationToken)
    {
        await repo.UpsertDoctorDayAsync(
            currentUser.ClinicId, request.DoctorId, request.DayOfWeek,
            request.StartTime, request.EndTime,
            currentUser.Id, cancellationToken);

        return Result<bool>.Success(true);
    }
}

// ── Delete doctor day ─────────────────────────────────────────────────────────
public sealed record DeleteDoctorDayCommand(Guid DoctorId, byte DayOfWeek) : IRequest<Result<bool>>;

public sealed class DeleteDoctorDayCommandHandler(IScheduleRepository repo, ICurrentUser currentUser)
    : IRequestHandler<DeleteDoctorDayCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(DeleteDoctorDayCommand request, CancellationToken cancellationToken)
    {
        await repo.DeleteDoctorDayAsync(request.DoctorId, request.DayOfWeek, currentUser.ClinicId, cancellationToken);
        return Result<bool>.Success(true);
    }
}
