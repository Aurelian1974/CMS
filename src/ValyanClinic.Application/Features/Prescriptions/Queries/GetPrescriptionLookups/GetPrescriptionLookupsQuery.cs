using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Prescriptions.DTOs;

namespace ValyanClinic.Application.Features.Prescriptions.Queries.GetPrescriptionLookups;

public sealed record GetPrescriptionLookupsQuery : IRequest<Result<PrescriptionLookupsDto>>;
