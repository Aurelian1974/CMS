using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.CreateClinicBankAccount;

public sealed record CreateClinicBankAccountCommand(
    string BankName,
    string Iban,
    string Currency,
    bool IsMain,
    string? Notes
) : IRequest<Result<Guid>>;
