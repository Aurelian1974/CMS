using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Tariffs.DTOs;

namespace ValyanClinic.Application.Features.Tariffs.Queries.GetMedicalServiceById;

public sealed record GetMedicalServiceByIdQuery(Guid Id) : IRequest<Result<MedicalServiceDetailDto>>;
