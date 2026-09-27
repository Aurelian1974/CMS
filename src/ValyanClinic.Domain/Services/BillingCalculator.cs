namespace ValyanClinic.Domain.Services;

/// <summary>
/// Reguli de calcul pentru sumele financiare. Aceleași reguli sunt aplicate autoritar
/// în SP-uri (coloana persistată ConsultationServices.LineTotal, Invoice_Create);
/// clasa există pentru previzualizări și pentru a fixa regulile prin teste.
/// Rotunjire: 2 zecimale, half away from zero — identic cu ROUND() din SQL Server
/// și cu calculul pe linie al casei de marcat.
/// </summary>
public static class BillingCalculator
{
    public static decimal LineTotal(decimal unitPrice, decimal quantity)
        => Math.Round(unitPrice * quantity, 2, MidpointRounding.AwayFromZero);

    /// <summary>Totalul = suma liniilor deja rotunjite; nu se mai rotunjește suplimentar.</summary>
    public static decimal Total(IEnumerable<decimal> lineTotals) => lineTotals.Sum();

    /// <summary>TVA-ul inclus într-un preț final (prețurile din nomenclator conțin TVA).</summary>
    public static decimal VatFromGross(decimal grossAmount, decimal vatPercent)
        => vatPercent <= 0
            ? 0m
            : Math.Round(grossAmount * vatPercent / (100m + vatPercent), 2, MidpointRounding.AwayFromZero);

    public static decimal Balance(decimal total, decimal paid) => total - paid;
}
