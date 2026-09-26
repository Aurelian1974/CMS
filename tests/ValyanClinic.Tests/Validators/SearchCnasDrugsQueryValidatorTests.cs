using FluentValidation.TestHelper;
using ValyanClinic.Application.Features.ConsultationMedications.Queries.SearchCnasDrugs;
using Xunit;

namespace ValyanClinic.Tests.Validators;

public sealed class SearchCnasDrugsQueryValidatorTests
{
    private readonly SearchCnasDrugsQueryValidator _validator = new();

    [Fact]
    public void ValidSearch_ShouldPassValidation()
    {
        _validator.TestValidate(new SearchCnasDrugsQuery("parac")).ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" a ")]
    public void Search_TooShort_ShouldHaveError(string search)
    {
        _validator.TestValidate(new SearchCnasDrugsQuery(search)).ShouldHaveValidationErrorFor(x => x.Search);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(51)]
    public void Top_OutOfRange_ShouldHaveError(int top)
    {
        _validator.TestValidate(new SearchCnasDrugsQuery("parac", top)).ShouldHaveValidationErrorFor(x => x.Top);
    }
}
