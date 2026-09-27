using ValyanClinic.Domain.Services;
using Xunit;

namespace ValyanClinic.Tests.Domain;

public sealed class BillingCalculatorTests
{
    [Fact]
    public void Total_ConsultationPlusSpirometry_Is150()
    {
        var consultation = BillingCalculator.LineTotal(100m, 1m);
        var spirometry   = BillingCalculator.LineTotal(50m, 1m);

        Assert.Equal(150.00m, BillingCalculator.Total([consultation, spirometry]));
    }

    [Theory]
    [InlineData(33.33, 3, 99.99)]
    [InlineData(10.005, 1, 10.01)]
    [InlineData(0.125, 1, 0.13)]
    [InlineData(12.50, 0.5, 6.25)]
    [InlineData(19.99, 1.333, 26.65)]
    public void LineTotal_RoundsHalfAwayFromZeroToTwoDecimals(decimal unitPrice, decimal quantity, decimal expected)
        => Assert.Equal(expected, BillingCalculator.LineTotal(unitPrice, quantity));

    [Fact]
    public void Total_IsSumOfRoundedLines_WithoutExtraRounding()
    {
        // 3 × 0,335 = 1,005 dacă s-ar însuma brut; pe linii rotunjite: 3 × 0,34 = 1,02
        var lines = Enumerable.Repeat(BillingCalculator.LineTotal(0.335m, 1m), 3);

        Assert.Equal(1.02m, BillingCalculator.Total(lines));
    }

    [Fact]
    public void Total_NoLines_IsZero()
        => Assert.Equal(0m, BillingCalculator.Total([]));

    [Theory]
    [InlineData(150, 0, 0)]
    [InlineData(121, 21, 21)]
    [InlineData(111, 11, 11)]
    [InlineData(100, 19, 15.97)]
    public void VatFromGross_ExtractsVatIncludedInFinalPrice(decimal gross, decimal percent, decimal expectedVat)
        => Assert.Equal(expectedVat, BillingCalculator.VatFromGross(gross, percent));

    [Fact]
    public void Balance_PartialPayment_ReturnsRemaining()
        => Assert.Equal(50m, BillingCalculator.Balance(150m, 100m));
}
