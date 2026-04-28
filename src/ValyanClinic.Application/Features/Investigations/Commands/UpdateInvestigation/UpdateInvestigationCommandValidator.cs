using FluentValidation;
using ValyanClinic.Application.Features.Investigations.Validation;

namespace ValyanClinic.Application.Features.Investigations.Commands.UpdateInvestigation;

public sealed class UpdateInvestigationCommandValidator : AbstractValidator<UpdateInvestigationCommand>
{
    public UpdateInvestigationCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.InvestigationType).NotEmpty().MaximumLength(50);
        RuleFor(x => x.InvestigationDate)
            .NotEmpty()
            .Must(d => d <= DateTime.UtcNow.AddDays(1))
            .WithMessage("Data investigației nu poate fi în viitor.");
        RuleFor(x => x.Status).Must(s => s is 0 or 1 or 2 or 3);
        RuleFor(x => x.ExternalSource).MaximumLength(200);

        RuleFor(x => x).Custom((cmd, ctx) =>
        {
            if (string.IsNullOrWhiteSpace(cmd.StructuredData)) return;
            var error = InvestigationStructuredValidator.Validate(cmd.InvestigationType, cmd.StructuredData);
            if (error is not null) ctx.AddFailure(nameof(cmd.StructuredData), error);
        });
    }
}
