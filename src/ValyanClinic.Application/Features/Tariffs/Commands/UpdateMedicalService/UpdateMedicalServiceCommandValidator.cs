using FluentValidation;

namespace ValyanClinic.Application.Features.Tariffs.Commands.UpdateMedicalService;

public sealed class UpdateMedicalServiceCommandValidator : AbstractValidator<UpdateMedicalServiceCommand>
{
    public UpdateMedicalServiceCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Codul serviciului este obligatoriu.")
            .MaximumLength(30).WithMessage("Codul nu poate depăși 30 de caractere.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Denumirea serviciului este obligatorie.")
            .MaximumLength(200).WithMessage("Denumirea nu poate depăși 200 de caractere.");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Categoria este obligatorie.");

        RuleFor(x => x.DurationMinutes)
            .InclusiveBetween(1, 1440).WithMessage("Durata trebuie să fie între 1 și 1440 de minute.")
            .When(x => x.DurationMinutes.HasValue);

        RuleFor(x => x.RowVersion)
            .NotNull().Must(v => v is { Length: 8 })
            .WithMessage("Versiunea înregistrării lipsește; reîncărcați datele.");
    }
}
