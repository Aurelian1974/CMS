using ValyanClinic.IntegrationTests.Fixtures;

namespace ValyanClinic.IntegrationTests;

/// <summary>
/// Clasă de bază opțională pentru testele care au nevoie de fixture și helper-e comune.
/// </summary>
[Collection(DatabaseCollection.Name)]
public abstract class IntegrationTestBase(IntegrationTestFixture fixture)
{
    protected IntegrationTestFixture Fixture { get; } = fixture;

    private static long _cnpCounter = Environment.TickCount64;

    /// <summary>
    /// Generează un CNP valid de test (13 cifre, prefix "9") unic per apel.
    /// Folosește un contor atomic pentru a evita coliziuni între teste rapide.
    /// </summary>
    protected static string NewTestCnp()
    {
        var value = System.Threading.Interlocked.Increment(ref _cnpCounter);
        var digits = Math.Abs(value).ToString("D12")[^12..];
        return "9" + digits;
    }

    /// <summary>Prefix recomandat pentru date de test ușor de identificat.</summary>
    protected const string TestPrefix = "IT_";

    /// <summary>JSON-ul ICD-10 salvat de client: un diagnostic principal + un secundar cu două coduri.</summary>
    protected const string DiagnosisJson = """
        {"primaryCode":{"code":"J44.0","shortDescriptionRo":"BPOC cu infecție acută"},
         "primaryDetails":"<p>BPOC exacerbat</p>",
         "secondaryDiagnoses":[{"id":"s1","description":"<p>Secundar</p>",
           "icd10Codes":[{"code":"I10","shortDescriptionRo":"HTA esențială"},
                         {"code":"J41.0","shortDescriptionRo":"Bronșită cronică simplă"}]}]}
        """;
}
