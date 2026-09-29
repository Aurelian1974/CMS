using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AdministrativeStaff.DTOs;

namespace ValyanClinic.Application.Features.AdministrativeStaff.Queries.GetAdministrativePositions;

/// <summary>Nomenclatorul funcțiilor administrative.</summary>
public sealed record GetAdministrativePositionsQuery(bool? IsActive = null)
    : IRequest<Result<IReadOnlyList<AdministrativePositionDto>>>;
