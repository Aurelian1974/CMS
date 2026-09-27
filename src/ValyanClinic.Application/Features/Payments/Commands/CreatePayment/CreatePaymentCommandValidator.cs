using FluentValidation;

namespace ValyanClinic.Application.Features.Payments.Commands.CreatePayment;

public sealed class CreatePaymentCommandValidator : AbstractValidator<CreatePaymentCommand>
{
    public CreatePaymentCommandValidator()
    {
        RuleFor(x => x.ConsultationId).NotEmpty().WithMessage("Consultația este obligatorie.");

        RuleFor(x => x.IdempotencyKey).NotEmpty().WithMessage("Cheia de idempotență lipsește.");

        RuleFor(x => x.Tenders)
            .NotEmpty().WithMessage("Selectați cel puțin o metodă de plată.")
            .Must(t => t.Select(x => x.PaymentMethodId).Distinct().Count() == t.Count)
            .WithMessage("O metodă de plată apare de mai multe ori.")
            .When(x => x.Tenders is not null);

        RuleForEach(x => x.Tenders).ChildRules(t =>
        {
            t.RuleFor(x => x.PaymentMethodId).NotEmpty().WithMessage("Metoda de plată este obligatorie.");
            t.RuleFor(x => x.Amount)
                .GreaterThan(0).WithMessage("Suma trebuie să fie mai mare decât zero.")
                .PrecisionScale(18, 2, true).WithMessage("Suma poate avea cel mult 2 zecimale.");
        });

        RuleFor(x => x.Notes).MaximumLength(500).WithMessage("Observațiile nu pot depăși 500 de caractere.");
    }
}
