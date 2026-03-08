using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.UpdateClinicBankAccount;

public sealed record UpdateClinicBankAccountCommand(
    Guid Id,
    string BankName,
    string Iban,
    string Currency,
    bool IsMain,
    string? Notes
) : IRequest<Result<bool>>;
