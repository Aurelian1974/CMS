namespace ValyanClinic.Application.Common.Constants;

/// <summary>
/// Coduri module — corespund coloanei Code din tabelul Modules.
///
/// Valorile sunt lowercase și compararea e ordinală: ModuleAccessAuthorizationHandler
/// caută codul într-un Dictionary&lt;string, int&gt; cu comparatorul implicit, deci o
/// nepotrivire de formă produce un 403 tăcut, exact ca la Roles.cs.
///
/// Fiecare constantă de aici TREBUIE să existe în dbo.Modules cu IsActive = 1 —
/// altfel Permission_GetEffectiveByUser o filtrează, iar orice [HasAccess] pe ea
/// refuză toți utilizatorii fără niciun indiciu despre cauză. Invarianta e verificată
/// de ModuleSeedTests din ValyanClinic.IntegrationTests.
///
/// MODULE din client/src/hooks/useHasAccess.ts trebuie să rămână sincron cu acest fișier.
///
/// RETRASE în migrarea 0057 (dezactivate în BD, constante eliminate de aici):
///   `reports`   — feature de rapoarte niciodată construit;
///   `documents` — destinat trimiterilor/scrisorilor medicale/concediilor, nescris.
///                 DocumentsController NU aparține acestui modul: servește atașamentele
///                 investigațiilor (dbo.Documents din 0036) și e protejat pe
///                 Consultations. Vezi comentariul din controller înainte de a-l „alinia".
/// Pentru reactivare: vezi capul migrării 0057_RetirePhantomModules.sql.
/// </summary>
public static class ModuleCodes
{
    public const string Dashboard     = "dashboard";
    public const string Patients      = "patients";
    public const string Appointments  = "appointments";
    public const string Consultations = "consultations";
    public const string Prescriptions = "prescriptions";
    public const string Invoices      = "invoices";
    public const string Payments      = "payments";
    public const string Nomenclature  = "nomenclature";
    public const string Users         = "users";
    public const string Clinic        = "clinic";
    public const string Cnas          = "cnas";
    public const string Anm           = "anm";
    public const string Audit         = "audit";
    public const string Settings      = "settings";
    public const string Tariffs       = "tariffs";
}
