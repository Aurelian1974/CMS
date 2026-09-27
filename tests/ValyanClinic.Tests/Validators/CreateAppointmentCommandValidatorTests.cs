using FluentValidation.TestHelper;
using ValyanClinic.Application.Features.Appointments.Commands.CreateAppointment;
using Xunit;

namespace ValyanClinic.Tests.Validators;

public sealed class CreateAppointmentCommandValidatorTests
{
    private readonly CreateAppointmentCommandValidator _validator = new();

    private static readonly DateTime Start = DateTime.Today.AddDays(1).AddHours(10);

    private static CreateAppointmentCommand MinimalValid() => new(
        PatientId: Guid.NewGuid(),
        DoctorId: Guid.NewGuid(),
        StartTime: Start,
        EndTime: Start.AddMinutes(30),
        StatusId: null,
        Notes: null);

    [Fact]
    public void MinimalValid_ShouldPassValidation() =>
        _validator.TestValidate(MinimalValid()).ShouldNotHaveAnyValidationErrors();

    [Fact]
    public void PatientId_WhenEmpty_ShouldHaveError() =>
        _validator.TestValidate(MinimalValid() with { PatientId = Guid.Empty })
                  .ShouldHaveValidationErrorFor(x => x.PatientId)
                  .WithErrorMessage("Pacientul este obligatoriu.");

    [Fact]
    public void DoctorId_WhenEmpty_ShouldHaveError() =>
        _validator.TestValidate(MinimalValid() with { DoctorId = Guid.Empty })
                  .ShouldHaveValidationErrorFor(x => x.DoctorId)
                  .WithErrorMessage("Doctorul este obligatoriu.");

    [Fact]
    public void EndTime_WhenBeforeStart_ShouldHaveError() =>
        _validator.TestValidate(MinimalValid() with { EndTime = Start.AddMinutes(-5) })
                  .ShouldHaveValidationErrorFor(x => x.EndTime)
                  .WithErrorMessage("Ora de sfârșit trebuie să fie după ora de început.");

    [Fact]
    public void Duration_WhenUnder5Minutes_ShouldHaveError() =>
        _validator.TestValidate(MinimalValid() with { EndTime = Start.AddMinutes(3) })
                  .ShouldHaveValidationErrorFor("EndTime")
                  .WithErrorMessage("Programarea trebuie să dureze cel puțin 5 minute.");

    [Fact]
    public void Duration_WhenOver8Hours_ShouldHaveError()
    {
        var start = DateTime.Today.AddDays(1).AddHours(7);
        _validator.TestValidate(MinimalValid() with { StartTime = start, EndTime = start.AddHours(9) })
                  .ShouldHaveValidationErrorFor("EndTime")
                  .WithErrorMessage("Programarea nu poate depăși 8 ore.");
    }

    [Fact]
    public void EndTime_WhenOnNextDay_ShouldHaveError()
    {
        var start = DateTime.Today.AddDays(1).AddHours(23);
        _validator.TestValidate(MinimalValid() with { StartTime = start, EndTime = start.AddHours(2) })
                  .ShouldHaveValidationErrorFor("EndTime")
                  .WithErrorMessage("Programarea trebuie să se încheie în aceeași zi.");
    }

    [Fact]
    public void StartTime_WhenOlderThanOneDay_ShouldHaveError()
    {
        var start = DateTime.Now.AddDays(-2);
        _validator.TestValidate(MinimalValid() with { StartTime = start, EndTime = start.AddMinutes(30) })
                  .ShouldHaveValidationErrorFor(x => x.StartTime)
                  .WithErrorMessage("Nu se pot crea programări mai vechi de o zi.");
    }

    [Fact]
    public void Notes_WhenTooLong_ShouldHaveError() =>
        _validator.TestValidate(MinimalValid() with { Notes = new string('x', 2001) })
                  .ShouldHaveValidationErrorFor(x => x.Notes)
                  .WithErrorMessage("Observațiile nu pot depăși 2000 de caractere.");
}
