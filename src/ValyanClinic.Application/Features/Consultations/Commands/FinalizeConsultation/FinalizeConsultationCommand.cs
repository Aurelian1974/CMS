using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Consultations.Commands.FinalizeConsultation;

/// <summary>Finalizează o consultație în lucru (INLUCRU → FINALIZATA).</summary>
public sealed record FinalizeConsultationCommand(Guid Id) : IRequest<Result<bool>>;
