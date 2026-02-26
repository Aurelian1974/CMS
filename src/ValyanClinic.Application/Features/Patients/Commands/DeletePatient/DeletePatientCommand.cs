using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Patients.Commands.DeletePatient;

/// <summary>Soft delete pacient.</summary>
public sealed record DeletePatientCommand(Guid Id) : IRequest<Result<bool>>;
