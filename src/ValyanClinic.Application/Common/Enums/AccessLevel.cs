namespace ValyanClinic.Application.Common.Enums;

/// <summary>Niveluri de acces pe module. Valorile corespund coloanei Level din tabelul AccessLevels.</summary>
public enum AccessLevel
{
    /// <summary>Fără acces — modulul nu e vizibil.</summary>
    None = 0,

    /// <summary>Vizualizare — doar citire liste și detalii.</summary>
    Read = 1,

    /// <summary>Editare — Read + creare + editare.</summary>
    Write = 2,

    /// <summary>Control total — Write + ștergere/anulare + acțiuni speciale.</summary>
    Full = 3
}
