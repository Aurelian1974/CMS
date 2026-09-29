using FluentValidation;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Validation;

namespace ValyanClinic.Application.Features.Users.Commands.ResetUserPassword;

public sealed class ResetUserPasswordCommandValidator : AbstractValidator<ResetUserPasswordCommand>
{
    public ResetUserPasswordCommandValidator(
        IPasswordPolicyChecker policy, IUserRepository users, ICurrentUser currentUser)
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Id-ul utilizatorului este obligatoriu.");

        // Aceeasi politica pe ambele fluxuri: un reset administrativ nu are voie sa
        // produca o parola pe care utilizatorul nu si-ar fi putut-o alege singur.
        RuleFor(x => x.NewPassword)
            .CustomAsync(async (password, ctx, ct) =>
            {
                // Cont inexistent: handler-ul raspunde cu NotFound, aici doar fara verificarea identitatii
                var target = await users.GetByIdAsync(ctx.InstanceToValidate.UserId, currentUser.ClinicId, ct);
                string?[]? identity = target is null
                    ? null
                    : [target.Email, target.Username, target.FirstName, target.LastName];

                foreach (var error in await policy.ValidateAsync(password, identity, ct))
                    ctx.AddFailure(nameof(ResetUserPasswordCommand.NewPassword), error);
            });
    }
}
