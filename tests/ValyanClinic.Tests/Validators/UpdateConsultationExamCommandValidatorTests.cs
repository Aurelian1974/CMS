using FluentValidation.TestHelper;
using ValyanClinic.Application.Features.Consultations.Commands.UpdateConsultationExam;
using Xunit;

namespace ValyanClinic.Tests.Validators;

public sealed class UpdateConsultationExamCommandValidatorTests
{
    private readonly UpdateConsultationExamCommandValidator _validator = new();

    private static UpdateConsultationExamCommand MinimalValid() => new(
        ConsultationId: Guid.NewGuid(),
        StareGenerala: null,
        Tegumente: null,
        Mucoase: null,
        Greutate: null,
        Inaltime: null,
        TensiuneSistolica: null,
        TensiuneDiastolica: null,
        Puls: null,
        FrecventaRespiratorie: null,
        Temperatura: null,
        SpO2: null,
        Edeme: null,
        Glicemie: null,
        GanglioniLimfatici: null,
        ExamenClinic: null,
        AlteObservatiiClinice: null);

    [Fact]
    public void MinimalValid_ShouldPassValidation()
    {
        _validator.TestValidate(MinimalValid()).ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void TypicalVitals_ShouldPassValidation()
    {
        var cmd = MinimalValid() with
        {
            Greutate = 72.5m, Inaltime = 175, TensiuneSistolica = 120, TensiuneDiastolica = 80,
            Puls = 72, FrecventaRespiratorie = 16, Temperatura = 36.6m, SpO2 = 98, Glicemie = 95m,
        };
        _validator.TestValidate(cmd).ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Puls_WhenZero_ShouldHaveError()
    {
        _validator.TestValidate(MinimalValid() with { Puls = 0 })
                  .ShouldHaveValidationErrorFor(x => x.Puls);
    }

    [Fact]
    public void Greutate_WhenZero_ShouldHaveError()
    {
        _validator.TestValidate(MinimalValid() with { Greutate = 0m })
                  .ShouldHaveValidationErrorFor(x => x.Greutate);
    }

    [Fact]
    public void TensiuneSistolica_WhenZero_ShouldHaveError()
    {
        _validator.TestValidate(MinimalValid() with { TensiuneSistolica = 0 })
                  .ShouldHaveValidationErrorFor(x => x.TensiuneSistolica);
    }

    [Theory]
    [InlineData(80, 80)]
    [InlineData(70, 90)]
    public void Systolic_NotAboveDiastolic_ShouldHaveError(int systolic, int diastolic)
    {
        var cmd = MinimalValid() with { TensiuneSistolica = systolic, TensiuneDiastolica = diastolic };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.TensiuneSistolica)
                  .WithErrorMessage("Tensiunea sistolică trebuie să fie mai mare decât cea diastolică.");
    }

    [Fact]
    public void OnlySystolic_ShouldNotApplyCrossRule()
    {
        _validator.TestValidate(MinimalValid() with { TensiuneSistolica = 120 })
                  .ShouldNotHaveAnyValidationErrors();
    }
}
