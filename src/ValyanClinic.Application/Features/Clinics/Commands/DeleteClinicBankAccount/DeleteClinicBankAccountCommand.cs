using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.DeleteClinicBankAccount;

public sealed record DeleteClinicBankAccountCommand(Guid Id) : IRequest<Result<bool>>;
