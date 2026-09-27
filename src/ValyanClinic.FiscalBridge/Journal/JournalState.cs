namespace ValyanClinic.FiscalBridge.Journal;

/// <summary>Stările unui job în jurnalul local.</summary>
public enum JournalState
{
    /// <summary>Comenzile au început să plece spre aparat — dacă procesul cade aici, rezultatul e necunoscut.</summary>
    Printing,
    Printed,
    Failed,
    Unknown,
}
