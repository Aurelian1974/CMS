using FluentValidation;

namespace ValyanClinic.Application.Features.Consultations.Commands.UpdateConsultationAnamnesis;

public sealed class UpdateConsultationAnamnesisCommandValidator : AbstractValidator<UpdateConsultationAnamnesisCommand>
{
    public UpdateConsultationAnamnesisCommandValidator()
    {
        RuleFor(x => x.ConsultationId)
            .NotEmpty().WithMessage("Id-ul consultației este obligatoriu.");

        RuleFor(x => x.Motiv)
            .MaximumLength(8000).WithMessage("Motivul nu poate depăși 8000 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.Motiv));
    }
}
