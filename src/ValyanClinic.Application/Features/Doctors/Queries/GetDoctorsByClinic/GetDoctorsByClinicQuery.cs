using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Doctors.DTOs;

namespace ValyanClinic.Application.Features.Doctors.Queries.GetDoctorsByClinic;

/// <summary>Listare simplificată doctori per clinică — pentru dropdown-uri și selecție.</summary>
public sealed record GetDoctorsByClinicQuery
    : IRequest<Result<IEnumerable<DoctorLookupDto>>>;
