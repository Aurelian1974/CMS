using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Doctors.Commands.DeleteDoctor;

/// <summary>Soft delete doctor.</summary>
public sealed record DeleteDoctorCommand(Guid Id) : IRequest<Result<bool>>;
