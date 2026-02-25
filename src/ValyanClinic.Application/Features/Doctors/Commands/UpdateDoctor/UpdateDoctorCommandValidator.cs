using FluentValidation;

namespace ValyanClinic.Application.Features.Doctors.Commands.UpdateDoctor;

public sealed class UpdateDoctorCommandValidator : AbstractValidator<UpdateDoctorCommand>
{
    public UpdateDoctorCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id-ul doctorului este obligatoriu.");

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

        RuleFor(x => x.MedicalCode)
            .MaximumLength(20).WithMessage("Parafa medicală nu poate depăși 20 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.MedicalCode));

        RuleFor(x => x.LicenseNumber)
            .MaximumLength(50).WithMessage("Numărul CMR nu poate depăși 50 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.LicenseNumber));

        // Subspecialitatea necesită o specializare selectată
        RuleFor(x => x.SubspecialtyId)
            .Null().WithMessage("Nu se poate selecta o subspecialitate fără a selecta o specializare.")
            .When(x => x.SpecialtyId == null && x.SubspecialtyId != null);
    }
}
