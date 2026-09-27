namespace ValyanClinic.FiscalBridge.Printing.Mock;

/// <summary>Scenariile simulate de <see cref="MockFiscalPrinter"/> — acoperă toate ramurile mașinii de stări.</summary>
public enum MockScenario
{
    None,
    PaperOut,
    CoverOpen,
    Offline,
    /// <summary>Aparatul refuză un articol → bonul deschis se anulează → sigur netipărit.</summary>
    DeviceErrorOnSale,
    /// <summary>Comanda de închidere a plecat, răspunsul s-a pierdut → rezultat necunoscut.</summary>
    TimeoutAfterClose,
}
