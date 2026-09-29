using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AdministrativeStaff.DTOs;

namespace ValyanClinic.Application.Features.AdministrativeStaff.Queries.GetAdministrativeStaffById;

/// <summary>Obținere membru al personalului administrativ după Id.</summary>
public sealed record GetAdministrativeStaffByIdQuery(Guid Id) : IRequest<Result<AdministrativeStaffDetailDto>>;
