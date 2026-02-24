using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.DeleteClinicLocation;

/// <summary>Soft delete locație fizică a clinicii.</summary>
public sealed record DeleteClinicLocationCommand(Guid Id) : IRequest<Result<bool>>;
