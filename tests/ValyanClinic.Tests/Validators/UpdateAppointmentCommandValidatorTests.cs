using FluentValidation.TestHelper;
using ValyanClinic.Application.Features.Appointments.Commands.UpdateAppointment;
using ValyanClinic.Application.Features.Appointments.Commands.UpdateAppointmentStatus;
using Xunit;

namespace ValyanClinic.Tests.Validators;

public sealed class UpdateAppointmentCommandValidatorTests
{
    private readonly UpdateAppointmentCommandValidator _validator = new();

    // Update acceptă și programări din trecut (corecții retroactive) — doar durata e limitată
    private static readonly DateTime Start = DateTime.Today.AddDays(-10).AddHours(10);

    private static UpdateAppointmentCommand MinimalValid() => new(
        Id: Guid.NewGuid(),
        PatientId: Guid.NewGuid(),
        DoctorId: Guid.NewGuid(),
        StartTime: Start,
        EndTime: Start.AddMinutes(30),
        StatusId: null,
        Notes: null);

    [Fact]
    public void MinimalValid_InThePast_ShouldPassValidation() =>
        _validator.TestValidate(MinimalValid()).ShouldNotHaveAnyValidationErrors();

    [Fact]
    public void Id_WhenEmpty_ShouldHaveError() =>
        _validator.TestValidate(MinimalValid() with { Id = Guid.Empty })
                  .ShouldHaveValidationErrorFor(x => x.Id)
                  .WithErrorMessage("Id-ul programării este obligatoriu.");

    [Fact]
    public void Duration_WhenUnder5Minutes_ShouldHaveError() =>
        _validator.TestValidate(MinimalValid() with { EndTime = Start.AddMinutes(4) })
                  .ShouldHaveValidationErrorFor("EndTime")
                  .WithErrorMessage("Programarea trebuie să dureze cel puțin 5 minute.");
}

public sealed class UpdateAppointmentStatusCommandValidatorTests
{
    private readonly UpdateAppointmentStatusCommandValidator _validator = new();

    [Fact]
    public void Valid_ShouldPassValidation() =>
        _validator.TestValidate(new UpdateAppointmentStatusCommand(Guid.NewGuid(), Guid.NewGuid()))
                  .ShouldNotHaveAnyValidationErrors();

    [Fact]
    public void StatusId_WhenEmpty_ShouldHaveError() =>
        _validator.TestValidate(new UpdateAppointmentStatusCommand(Guid.NewGuid(), Guid.Empty))
                  .ShouldHaveValidationErrorFor(x => x.StatusId)
                  .WithErrorMessage("Id-ul statusului este obligatoriu.");
}
