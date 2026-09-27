using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Billing.DTOs;

namespace ValyanClinic.Application.Features.Billing.Queries.GetConsultationBilling;

public sealed record GetConsultationBillingQuery(Guid ConsultationId) : IRequest<Result<ConsultationBillingDto>>;
