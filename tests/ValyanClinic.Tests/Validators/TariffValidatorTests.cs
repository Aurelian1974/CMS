using FluentValidation.TestHelper;
using ValyanClinic.Application.Features.ConsultationServices.Commands.AddConsultationService;
using ValyanClinic.Application.Features.Tariffs.Commands.CreateMedicalService;
using ValyanClinic.Application.Features.Tariffs.Commands.CreateVatRate;
using Xunit;

namespace ValyanClinic.Tests.Validators;

public sealed class TariffValidatorTests
{
    private readonly CreateMedicalServiceCommandValidator _serviceValidator = new();
    private readonly CreateVatRateCommandValidator        _vatValidator     = new();
    private readonly AddConsultationServiceCommandValidator _lineValidator  = new();

    private static CreateMedicalServiceCommand ValidService() => new(
        Code: "CONS",
        Name: "Consultație pneumologie",
        CategoryId: Guid.NewGuid(),
        DurationMinutes: 30,
        InvestigationTypeCode: null,
        Price: 100m,
        VatRateId: Guid.NewGuid(),
        ValidFrom: null);

    [Fact]
    public void Service_Valid_PassesValidation()
        => _serviceValidator.TestValidate(ValidService()).ShouldNotHaveAnyValidationErrors();

    [Fact]
    public void Service_NegativePrice_HasError()
        => _serviceValidator.TestValidate(ValidService() with { Price = -1m })
            .ShouldHaveValidationErrorFor(x => x.Price)
            .WithErrorMessage("Prețul nu poate fi negativ.");

    [Fact]
    public void Service_PriceWithThreeDecimals_HasError()
        => _serviceValidator.TestValidate(ValidService() with { Price = 10.005m })
            .ShouldHaveValidationErrorFor(x => x.Price);

    [Fact]
    public void Service_MissingCode_HasError()
        => _serviceValidator.TestValidate(ValidService() with { Code = "" })
            .ShouldHaveValidationErrorFor(x => x.Code);

    [Fact]
    public void Service_MissingVatRate_HasError()
        => _serviceValidator.TestValidate(ValidService() with { VatRateId = Guid.Empty })
            .ShouldHaveValidationErrorFor(x => x.VatRateId);

    [Fact]
    public void VatRate_ExemptWithPositivePercent_HasError()
        => _vatValidator.TestValidate(new CreateVatRateCommand("X", "Scutit", 21m, "E", null, null))
            .ShouldHaveValidationErrorFor(x => x.Percent);

    [Fact]
    public void VatRate_Standard21_PassesValidation()
        => _vatValidator.TestValidate(new CreateVatRateCommand("S21", "Cota standard", 21m, "S", null, null))
            .ShouldNotHaveAnyValidationErrors();

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Line_NonPositiveQuantity_HasError(decimal quantity)
        => _lineValidator.TestValidate(new AddConsultationServiceCommand(Guid.NewGuid(), Guid.NewGuid(), quantity))
            .ShouldHaveValidationErrorFor(x => x.Quantity);
}
