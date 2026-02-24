using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Queries.GetSpecialtyTree;

/// <summary>Query care returnează arborele ierarhic de specializări.</summary>
public sealed record GetSpecialtyTreeQuery(bool? IsActive = null)
    : IRequest<Result<IEnumerable<SpecialtyTreeNodeDto>>>;
