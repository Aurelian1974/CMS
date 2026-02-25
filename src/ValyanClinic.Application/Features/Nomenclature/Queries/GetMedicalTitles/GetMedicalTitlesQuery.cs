using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Queries.GetMedicalTitles;

/// <summary>Query care returnează toate titularturile medicale, filtrate opțional pe IsActive.</summary>
public sealed record GetMedicalTitlesQuery(bool? IsActive = null)
    : IRequest<Result<IEnumerable<MedicalTitleDto>>>;
