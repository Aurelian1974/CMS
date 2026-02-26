using FluentValidation;

namespace ValyanClinic.Application.Features.Permissions.Commands.UpdateRolePermissions;

public sealed class UpdateRolePermissionsCommandValidator
    : AbstractValidator<UpdateRolePermissionsCommand>
{
    public UpdateRolePermissionsCommandValidator()
    {
        RuleFor(x => x.RoleId)
            .NotEmpty().WithMessage("RoleId este obligatoriu.");

        RuleFor(x => x.Permissions)
            .NotNull().WithMessage("Lista de permisiuni este obligatorie.")
            .Must(p => p.Count > 0).WithMessage("Lista de permisiuni nu poate fi goală.");

        RuleForEach(x => x.Permissions).ChildRules(item =>
        {
            item.RuleFor(p => p.ModuleId)
                .NotEmpty().WithMessage("ModuleId este obligatoriu.");

            item.RuleFor(p => p.AccessLevelId)
                .NotEmpty().WithMessage("AccessLevelId este obligatoriu.");
        });
    }
}
