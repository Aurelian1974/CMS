using FluentValidation;

namespace ValyanClinic.Application.Features.ConsultationServices.Commands.UpdateConsultationServiceQuantity;

public sealed class UpdateConsultationServiceQuantityCommandValidator
    : AbstractValidator<UpdateConsultationServiceQuantityCommand>
{
    public UpdateConsultationServiceQuantityCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Cantitatea trebuie să fie mai mare decât zero.")
            .LessThanOrEqualTo(1000).WithMessage("Cantitatea nu poate depăși 1000.")
            .PrecisionScale(10, 3, true).WithMessage("Cantitatea poate avea cel mult 3 zecimale.");
    }
}
