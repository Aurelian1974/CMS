using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Tariffs.DTOs;

namespace ValyanClinic.Application.Features.Tariffs.Queries.GetVatRates;

public sealed record GetVatRatesQuery : IRequest<Result<IReadOnlyList<VatRateDto>>>;
