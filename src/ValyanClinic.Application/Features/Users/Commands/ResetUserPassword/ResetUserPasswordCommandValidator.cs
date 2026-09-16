using FluentValidation;
using ValyanClinic.Application.Common.Validation;

namespace ValyanClinic.Application.Features.Users.Commands.ResetUserPassword;

public sealed class ResetUserPasswordCommandValidator : AbstractValidator<ResetUserPasswordCommand>
{
    public ResetUserPasswordCommandValidator(IPasswordPolicyChecker policy)
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Id-ul utilizatorului este obligatoriu.");

        // Aceeasi politica pe ambele fluxuri: un reset administrativ nu are voie sa
        // produca o parola pe care utilizatorul nu si-ar fi putut-o alege singur.
        RuleFor(x => x.NewPassword)
            .CustomAsync(async (password, ctx, ct) =>
            {
                foreach (var error in await policy.ValidateAsync(password, ct: ct))
                    ctx.AddFailure(nameof(ResetUserPasswordCommand.NewPassword), error);
            });
    }
}
