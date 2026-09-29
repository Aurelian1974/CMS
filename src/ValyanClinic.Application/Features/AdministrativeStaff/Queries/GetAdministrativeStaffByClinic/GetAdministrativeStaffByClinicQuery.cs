using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AdministrativeStaff.DTOs;

namespace ValyanClinic.Application.Features.AdministrativeStaff.Queries.GetAdministrativeStaffByClinic;

/// <summary>Listare simplificată personal administrativ activ — pentru dropdown-uri.</summary>
public sealed record GetAdministrativeStaffByClinicQuery
    : IRequest<Result<IEnumerable<AdministrativeStaffLookupDto>>>;
