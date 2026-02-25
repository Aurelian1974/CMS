using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.MedicalStaff.DTOs;

namespace ValyanClinic.Application.Features.MedicalStaff.Queries.GetMedicalStaffByClinic;

/// <summary>Listare simplificată personal medical per clinică — pentru dropdown-uri și departamente detail.</summary>
public sealed record GetMedicalStaffByClinicQuery
    : IRequest<Result<IEnumerable<MedicalStaffLookupDto>>>;
