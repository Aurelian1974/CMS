using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.ConsultationServices.Commands.SyncInvestigationServices;

/// <summary>Adaugă liniile de serviciu lipsă din investigațiile consultației; întoarce numărul de linii adăugate.</summary>
public sealed record SyncInvestigationServicesCommand(Guid ConsultationId) : IRequest<Result<int>>;
