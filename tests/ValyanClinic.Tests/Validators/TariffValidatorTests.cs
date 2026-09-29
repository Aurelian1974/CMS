using FluentValidation.TestHelper;
using ValyanClinic.Application.Features.ConsultationServices.Commands.AddConsultationService;
using ValyanClinic.Application.Features.Tariffs.Commands.CreateMedicalService;
using ValyanClinic.Application.Features.Tariffs.Commands.CreateVatRate;
using ValyanClinic.Application.Features.Tariffs.Commands.ImportInvestigationServices;
using ValyanClinic.Application.Features.Tariffs.DTOs;
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

    private readonly ImportInvestigationServicesCommandValidator _importValidator = new();

    private static ImportInvestigationServicesCommand ValidImport(params InvestigationServiceImportItem[] items) => new(
        Items: items.Length > 0 ? items : [new InvestigationServiceImportItem("ECG", "Electrocardiogramă", 80m)],
        VatRateId: Guid.NewGuid(),
        ValidFrom: null);

    [Fact]
    public void Import_Valid_PassesValidation()
        => _importValidator.TestValidate(ValidImport()).ShouldNotHaveAnyValidationErrors();

    [Fact]
    public void Import_WithoutPricesAndVatRate_PassesValidation()
        => _importValidator.TestValidate(ValidImport(new InvestigationServiceImportItem("ECG", "EKG", null)) with { VatRateId = null })
            .ShouldNotHaveAnyValidationErrors();

    [Fact]
    public void Import_EmptyList_HasError()
        => _importValidator.TestValidate(ValidImport() with { Items = [] })
            .ShouldHaveValidationErrorFor(x => x.Items)
            .WithErrorMessage("Selectați cel puțin o investigație.");

    [Fact]
    public void Import_DuplicateType_HasError()
        => _importValidator.TestValidate(ValidImport(
                new InvestigationServiceImportItem("ECG", "EKG", null),
                new InvestigationServiceImportItem("ECG", "EKG repetat", null)))
            .ShouldHaveValidationErrorFor(x => x.Items)
            .WithErrorMessage("O investigație apare de mai multe ori în listă.");

    [Fact]
    public void Import_NegativePrice_HasError()
        => _importValidator.TestValidate(ValidImport(new InvestigationServiceImportItem("ECG", "EKG", -5m)))
            .ShouldHaveValidationErrorFor("Items[0].Price")
            .WithErrorMessage("Prețul nu poate fi negativ.");

    [Fact]
    public void Import_MissingName_HasError()
        => _importValidator.TestValidate(ValidImport(new InvestigationServiceImportItem("ECG", " ", null)))
            .ShouldHaveValidationErrorFor("Items[0].Name");

    [Fact]
    public void Import_PriceWithoutVatRate_HasError()
        => _importValidator.TestValidate(ValidImport() with { VatRateId = null })
            .ShouldHaveValidationErrorFor(x => x.VatRateId);
}
