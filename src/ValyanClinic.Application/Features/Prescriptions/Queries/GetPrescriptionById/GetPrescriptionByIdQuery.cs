using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Prescriptions.DTOs;

namespace ValyanClinic.Application.Features.Prescriptions.Queries.GetPrescriptionById;

public sealed record GetPrescriptionByIdQuery(Guid Id) : IRequest<Result<PrescriptionDetailDto>>;
