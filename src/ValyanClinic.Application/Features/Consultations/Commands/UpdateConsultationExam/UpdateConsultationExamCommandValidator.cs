using FluentValidation;

namespace ValyanClinic.Application.Features.Consultations.Commands.UpdateConsultationExam;

public sealed class UpdateConsultationExamCommandValidator : AbstractValidator<UpdateConsultationExamCommand>
{
    public UpdateConsultationExamCommandValidator()
    {
        RuleFor(x => x.ConsultationId)
            .NotEmpty().WithMessage("Id-ul consultației este obligatoriu.");

        RuleFor(x => x.StareGenerala).MaximumLength(50);
        RuleFor(x => x.Tegumente).MaximumLength(50);
        RuleFor(x => x.Mucoase).MaximumLength(50);
        RuleFor(x => x.Edeme).MaximumLength(50);
        RuleFor(x => x.GanglioniLimfatici).MaximumLength(100);

        RuleFor(x => x.Greutate).InclusiveBetween(0, 500m).When(x => x.Greutate.HasValue);
        RuleFor(x => x.Inaltime).InclusiveBetween(0, 250).When(x => x.Inaltime.HasValue);
        RuleFor(x => x.TensiuneSistolica).InclusiveBetween(0, 300).When(x => x.TensiuneSistolica.HasValue);
        RuleFor(x => x.TensiuneDiastolica).InclusiveBetween(0, 200).When(x => x.TensiuneDiastolica.HasValue);
        RuleFor(x => x.Puls).InclusiveBetween(0, 300).When(x => x.Puls.HasValue);
        RuleFor(x => x.FrecventaRespiratorie).InclusiveBetween(0, 100).When(x => x.FrecventaRespiratorie.HasValue);
        RuleFor(x => x.Temperatura).InclusiveBetween(30, 45m).When(x => x.Temperatura.HasValue);
        RuleFor(x => x.SpO2).InclusiveBetween(0, 100).When(x => x.SpO2.HasValue);
        RuleFor(x => x.Glicemie).InclusiveBetween(0, 1000m).When(x => x.Glicemie.HasValue);
    }
}
