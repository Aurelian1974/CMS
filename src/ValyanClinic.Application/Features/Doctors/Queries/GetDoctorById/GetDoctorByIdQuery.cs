using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Doctors.DTOs;

namespace ValyanClinic.Application.Features.Doctors.Queries.GetDoctorById;

/// <summary>Obținere doctor după Id.</summary>
public sealed record GetDoctorByIdQuery(Guid Id) : IRequest<Result<DoctorDetailDto>>;
