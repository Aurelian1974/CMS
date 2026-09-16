using FluentValidation;
using ValyanClinic.Application.Common.Validation;

namespace ValyanClinic.Application.Features.Users.Commands.ChangeOwnPassword;

public sealed class ChangeOwnPasswordCommandValidator : AbstractValidator<ChangeOwnPasswordCommand>
{
    public ChangeOwnPasswordCommandValidator(IPasswordPolicyChecker policy)
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage("Parola curentă este obligatorie.");

        // CustomAsync, nu reguli fluente: politica e citita din baza de date la
        // fiecare validare, deci nu poate fi construita in constructor.
        RuleFor(x => x.NewPassword)
            .CustomAsync(async (password, ctx, ct) =>
            {
                foreach (var error in await policy.ValidateAsync(password, ct: ct))
                    ctx.AddFailure(nameof(ChangeOwnPasswordCommand.NewPassword), error);
            });
    }
}
