using FluentValidation.TestHelper;
using ValyanClinic.Application.Features.Dashboard.Queries.GetDashboard;
using Xunit;

namespace ValyanClinic.Tests.Validators;

public sealed class GetDashboardQueryValidatorTests
{
    private readonly GetDashboardQueryValidator _validator = new();

    [Theory]
    [InlineData(7)]
    [InlineData(30)]
    [InlineData(180)]
    public void TrendDays_WithinRange_IsValid(int days)
        => _validator.TestValidate(new GetDashboardQuery(days)).ShouldNotHaveAnyValidationErrors();

    [Theory]
    [InlineData(6)]
    [InlineData(181)]
    public void TrendDays_OutOfRange_HasError(int days)
        => _validator.TestValidate(new GetDashboardQuery(days))
            .ShouldHaveValidationErrorFor(x => x.TrendDays)
            .WithErrorMessage("Perioada pentru grafice trebuie să fie între 7 și 180 de zile.");
}
