using FluentValidation;

namespace ValyanClinic.Application.Features.Permissions.Commands.UpdateUserOverrides;

public sealed class UpdateUserOverridesCommandValidator
    : AbstractValidator<UpdateUserOverridesCommand>
{
    public UpdateUserOverridesCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("UserId este obligatoriu.");

        RuleFor(x => x.Overrides)
            .NotNull().WithMessage("Lista de override-uri este obligatorie.");

        RuleForEach(x => x.Overrides).ChildRules(item =>
        {
            item.RuleFor(o => o.ModuleId)
                .NotEmpty().WithMessage("ModuleId este obligatoriu.");

            item.RuleFor(o => o.AccessLevelId)
                .NotEmpty().WithMessage("AccessLevelId este obligatoriu.");
        });
    }
}
