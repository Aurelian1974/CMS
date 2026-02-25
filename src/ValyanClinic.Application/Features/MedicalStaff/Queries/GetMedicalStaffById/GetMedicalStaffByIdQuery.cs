using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.MedicalStaff.DTOs;

namespace ValyanClinic.Application.Features.MedicalStaff.Queries.GetMedicalStaffById;

/// <summary>Obținere personal medical după Id.</summary>
public sealed record GetMedicalStaffByIdQuery(Guid Id) : IRequest<Result<MedicalStaffDetailDto>>;
