using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Payments.Commands.CancelPayment;

/// <summary>Anulează o încasare al cărei bon nu a fost emis (în așteptare / eșuat).</summary>
public sealed record CancelPaymentCommand(Guid Id, string Reason) : IRequest<Result<bool>>;
