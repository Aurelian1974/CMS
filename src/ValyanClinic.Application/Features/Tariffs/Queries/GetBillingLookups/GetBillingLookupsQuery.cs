using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Tariffs.DTOs;

namespace ValyanClinic.Application.Features.Tariffs.Queries.GetBillingLookups;

public sealed record GetBillingLookupsQuery : IRequest<Result<BillingLookupsDto>>;
