using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Consultations.Commands.DeleteConsultation;

/// <summary>Soft delete consultație.</summary>
public sealed record DeleteConsultationCommand(Guid Id) : IRequest<Result<bool>>;
