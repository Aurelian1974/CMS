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
            .MinimumLength(8).WithMessage("Parola trebuie să aibă minimum 8 caractere.")
            .MaximumLength(100).WithMessage("Parola nu poate depăși 100 de caractere.");

        // Dacă CurrentPassword este furnizată, nu poate fi goală
        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage("Parola curentă nu poate fi goală dacă este furnizată.")
            .When(x => x.CurrentPassword is not null);
    }
}
