using FluentValidation;

namespace ValyanClinic.Application.Features.ConsultationServices.Commands.AddConsultationService;

public sealed class AddConsultationServiceCommandValidator : AbstractValidator<AddConsultationServiceCommand>
{
    public AddConsultationServiceCommandValidator()
    {
        RuleFor(x => x.ConsultationId).NotEmpty().WithMessage("Consultația este obligatorie.");
        RuleFor(x => x.MedicalServiceId).NotEmpty().WithMessage("Serviciul este obligatoriu.");
        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Cantitatea trebuie să fie mai mare decât zero.")
            .LessThanOrEqualTo(1000).WithMessage("Cantitatea nu poate depăși 1000.")
            .PrecisionScale(10, 3, true).WithMessage("Cantitatea poate avea cel mult 3 zecimale.");
    }
}
