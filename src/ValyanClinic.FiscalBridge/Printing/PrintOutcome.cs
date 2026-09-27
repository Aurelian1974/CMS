namespace ValyanClinic.FiscalBridge.Printing;

/// <summary>Rezultatul unei tipăriri — trimis de browser la ValyanClinic (PRINTED / FAILED / UNKNOWN).</summary>
public enum PrintOutcome
{
    /// <summary>Bonul a fost emis; <see cref="PrintResult.ReceiptNumber"/> e completat.</summary>
    Printed,

    /// <summary>Sigur NU s-a emis bon (aparat indisponibil, hârtie, capac, bon anulat). Se poate reîncerca.</summary>
    Failed,

    /// <summary>Nu se știe dacă s-a emis bonul — doar reconciliere manuală, niciodată retipărire automată.</summary>
    Unknown,
}
