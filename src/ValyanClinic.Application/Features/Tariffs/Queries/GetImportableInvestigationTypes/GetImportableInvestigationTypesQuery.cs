using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Tariffs.DTOs;

namespace ValyanClinic.Application.Features.Tariffs.Queries.GetImportableInvestigationTypes;

public sealed record GetImportableInvestigationTypesQuery : IRequest<Result<IReadOnlyList<ImportableInvestigationTypeDto>>>;
