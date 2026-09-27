using FluentValidation.TestHelper;
using ValyanClinic.Application.Features.Appointments.Queries.GetAppointmentConflicts;
using ValyanClinic.Application.Features.Appointments.Queries.GetAppointments;
using ValyanClinic.Application.Features.Appointments.Queries.GetAppointmentsForScheduler;
using Xunit;

namespace ValyanClinic.Tests.Validators;

public sealed class GetAppointmentsQueryValidatorTests
{
    private readonly GetAppointmentsQueryValidator _validator = new();

    [Fact]
    public void Defaults_ShouldPassValidation() =>
        _validator.TestValidate(new GetAppointmentsQuery()).ShouldNotHaveAnyValidationErrors();

    [Theory]
    [InlineData(0)]
    [InlineData(201)]
    [InlineData(1_000_000)]
    public void PageSize_OutOfRange_ShouldHaveError(int pageSize) =>
        _validator.TestValidate(new GetAppointmentsQuery(PageSize: pageSize))
                  .ShouldHaveValidationErrorFor(x => x.PageSize);

    [Fact]
    public void Page_WhenZero_ShouldHaveError() =>
        _validator.TestValidate(new GetAppointmentsQuery(Page: 0))
                  .ShouldHaveValidationErrorFor(x => x.Page);

    [Theory]
    [InlineData("startTime")]
    [InlineData("PATIENTNAME")]
    [InlineData("createdAt")]
    public void SortBy_KnownFieldAnyCase_ShouldPass(string sortBy) =>
        _validator.TestValidate(new GetAppointmentsQuery(SortBy: sortBy))
                  .ShouldNotHaveValidationErrorFor(x => x.SortBy);

    [Fact]
    public void SortBy_Unknown_ShouldHaveError() =>
        _validator.TestValidate(new GetAppointmentsQuery(SortBy: "DROP TABLE"))
                  .ShouldHaveValidationErrorFor(x => x.SortBy)
                  .WithErrorMessage("Câmpul de sortare nu este valid.");

    [Fact]
    public void SortDir_Invalid_ShouldHaveError() =>
        _validator.TestValidate(new GetAppointmentsQuery(SortDir: "sideways"))
                  .ShouldHaveValidationErrorFor(x => x.SortDir);

    [Fact]
    public void DateTo_BeforeDateFrom_ShouldHaveError() =>
        _validator.TestValidate(new GetAppointmentsQuery(DateFrom: DateTime.Today, DateTo: DateTime.Today.AddDays(-1)))
                  .ShouldHaveValidationErrorFor(x => x.DateTo);

    [Fact]
    public void Search_TooLong_ShouldHaveError() =>
        _validator.TestValidate(new GetAppointmentsQuery(Search: new string('x', 201)))
                  .ShouldHaveValidationErrorFor(x => x.Search);
}

public sealed class GetAppointmentsForSchedulerQueryValidatorTests
{
    private readonly GetAppointmentsForSchedulerQueryValidator _validator = new();

    [Fact]
    public void OneWeek_ShouldPassValidation() =>
        _validator.TestValidate(new GetAppointmentsForSchedulerQuery(DateTime.Today, DateTime.Today.AddDays(6), null))
                  .ShouldNotHaveAnyValidationErrors();

    [Fact]
    public void RangeOver93Days_ShouldHaveError() =>
        Assert.False(_validator.Validate(
            new GetAppointmentsForSchedulerQuery(DateTime.Today, DateTime.Today.AddDays(94), null)).IsValid);
}

public sealed class GetAppointmentConflictsQueryValidatorTests
{
    private readonly GetAppointmentConflictsQueryValidator _validator = new();

    [Fact]
    public void Valid_ShouldPassValidation() =>
        _validator.TestValidate(new GetAppointmentConflictsQuery(Guid.NewGuid(), DateTime.Today.AddHours(9), DateTime.Today.AddHours(10), null))
                  .ShouldNotHaveAnyValidationErrors();

    [Fact]
    public void DoctorId_WhenEmpty_ShouldHaveError() =>
        _validator.TestValidate(new GetAppointmentConflictsQuery(Guid.Empty, DateTime.Today.AddHours(9), DateTime.Today.AddHours(10), null))
                  .ShouldHaveValidationErrorFor(x => x.DoctorId);

    [Fact]
    public void EndTime_NotAfterStart_ShouldHaveError() =>
        _validator.TestValidate(new GetAppointmentConflictsQuery(Guid.NewGuid(), DateTime.Today.AddHours(10), DateTime.Today.AddHours(10), null))
                  .ShouldHaveValidationErrorFor(x => x.EndTime);
}
