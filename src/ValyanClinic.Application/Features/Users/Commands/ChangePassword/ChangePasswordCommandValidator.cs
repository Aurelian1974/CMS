using FluentValidation;

namespace ValyanClinic.Application.Features.Users.Commands.ChangePassword;

public sealed class ChangePasswordCommandValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Id-ul utilizatorului este obligatoriu.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Parola nouă este obligatorie.")
            .MinimumLength(6).WithMessage("Parola trebuie să aibă minimum 6 caractere.")
            .MaximumLength(100).WithMessage("Parola nu poate depăși 100 de caractere.");
    }
}
