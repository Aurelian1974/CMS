using FluentValidation;

namespace ValyanClinic.Application.Features.Patients.Commands.CreatePatient;

public sealed class CreatePatientCommandValidator : AbstractValidator<CreatePatientCommand>
{
    public CreatePatientCommandValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("Prenumele este obligatoriu.")
            .MaximumLength(100).WithMessage("Prenumele nu poate depăși 100 de caractere.");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Numele este obligatoriu.")
            .MaximumLength(100).WithMessage("Numele nu poate depăși 100 de caractere.");

        RuleFor(x => x.Cnp)
            .Matches(@"^[1-9]\d{12}$").WithMessage("CNP-ul trebuie să aibă 13 cifre valide.")
            .When(x => !string.IsNullOrWhiteSpace(x.Cnp));

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Adresa de email nu este validă.")
            .MaximumLength(200).WithMessage("Email-ul nu poate depăși 200 de caractere.")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(20).WithMessage("Telefonul nu poate depăși 20 de caractere.")
            .When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber));

        RuleFor(x => x.SecondaryPhone)
            .MaximumLength(20).WithMessage("Telefonul secundar nu poate depăși 20 de caractere.")
            .When(x => !string.IsNullOrWhiteSpace(x.SecondaryPhone));

        RuleFor(x => x.Address)
            .MaximumLength(500).WithMessage("Adresa nu poate depăși 500 de caractere.")
            .When(x => !string.IsNullOrWhiteSpace(x.Address));

        RuleFor(x => x.City)
            .MaximumLength(100).WithMessage("Orașul nu poate depăși 100 de caractere.")
            .When(x => !string.IsNullOrWhiteSpace(x.City));

        RuleFor(x => x.County)
            .MaximumLength(100).WithMessage("Județul nu poate depăși 100 de caractere.")
            .When(x => !string.IsNullOrWhiteSpace(x.County));

        RuleFor(x => x.PostalCode)
            .MaximumLength(10).WithMessage("Codul poștal nu poate depăși 10 de caractere.")
            .When(x => !string.IsNullOrWhiteSpace(x.PostalCode));

        RuleFor(x => x.InsuranceNumber)
            .MaximumLength(50).WithMessage("Numărul de asigurare nu poate depăși 50 de caractere.")
            .When(x => !string.IsNullOrWhiteSpace(x.InsuranceNumber));

        RuleFor(x => x.ChronicDiseases)
            .MaximumLength(2000).WithMessage("Bolile cronice nu pot depăși 2000 de caractere.")
            .When(x => !string.IsNullOrWhiteSpace(x.ChronicDiseases));

        RuleFor(x => x.FamilyDoctorName)
            .MaximumLength(200).WithMessage("Numele medicului de familie nu poate depăși 200 de caractere.")
            .When(x => !string.IsNullOrWhiteSpace(x.FamilyDoctorName));

        RuleFor(x => x.Notes)
            .MaximumLength(2000).WithMessage("Notele nu pot depăși 2000 de caractere.")
            .When(x => !string.IsNullOrWhiteSpace(x.Notes));

        // Validare alergii individuale
        RuleForEach(x => x.Allergies).ChildRules(allergy =>
        {
            allergy.RuleFor(a => a.AllergenName)
                .NotEmpty().WithMessage("Numele alergenului este obligatoriu.")
                .MaximumLength(200).WithMessage("Numele alergenului nu poate depăși 200 de caractere.");

            allergy.RuleFor(a => a.AllergyTypeId)
                .NotEmpty().WithMessage("Tipul alergiei este obligatoriu.");

            allergy.RuleFor(a => a.AllergySeverityId)
                .NotEmpty().WithMessage("Severitatea alergiei este obligatorie.");
        });

        // Validare contacte urgență individuale
        RuleForEach(x => x.EmergencyContacts).ChildRules(contact =>
        {
            contact.RuleFor(c => c.FullName)
                .NotEmpty().WithMessage("Numele contactului este obligatoriu.")
                .MaximumLength(200).WithMessage("Numele contactului nu poate depăși 200 de caractere.");

            contact.RuleFor(c => c.Relationship)
                .NotEmpty().WithMessage("Relația este obligatorie.")
                .MaximumLength(100).WithMessage("Relația nu poate depăși 100 de caractere.");

            contact.RuleFor(c => c.PhoneNumber)
                .NotEmpty().WithMessage("Telefonul contactului este obligatoriu.")
                .MaximumLength(20).WithMessage("Telefonul contactului nu poate depăși 20 de caractere.");
        });
    }
}
