using FluentValidation;
using ValyanClinic.Application.Common.Validation;

namespace ValyanClinic.Application.Features.Users.Commands.ResetUserPassword;

public sealed class ResetUserPasswordCommandValidator : AbstractValidator<ResetUserPasswordCommand>
{
    public ResetUserPasswordCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Id-ul utilizatorului este obligatoriu.");

        RuleFor(x => x.NewPassword)
            .ApplyPasswordPolicy();
    }
}
