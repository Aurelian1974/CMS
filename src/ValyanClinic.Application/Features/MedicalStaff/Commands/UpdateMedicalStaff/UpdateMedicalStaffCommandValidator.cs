using FluentValidation;

namespace ValyanClinic.Application.Features.MedicalStaff.Commands.UpdateMedicalStaff;

public sealed class UpdateMedicalStaffCommandValidator : AbstractValidator<UpdateMedicalStaffCommand>
{
    public UpdateMedicalStaffCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id-ul membrului personalului medical este obligatoriu.");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("Prenumele este obligatoriu.")
            .MaximumLength(100).WithMessage("Prenumele nu poate depăși 100 de caractere.");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Numele este obligatoriu.")
            .MaximumLength(100).WithMessage("Numele nu poate depăși 100 de caractere.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Adresa de email este obligatorie.")
            .MaximumLength(200).WithMessage("Adresa de email nu poate depăși 200 de caractere.")
            .EmailAddress().WithMessage("Adresa de email nu este validă.");

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(20).WithMessage("Numărul de telefon nu poate depăși 20 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.PhoneNumber));
    }
}
