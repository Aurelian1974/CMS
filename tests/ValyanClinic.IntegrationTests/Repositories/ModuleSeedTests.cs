using System.Reflection;
using Dapper;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.IntegrationTests.Fixtures;

namespace ValyanClinic.IntegrationTests.Repositories;

/// <summary>
/// Verifică invarianta care leagă constantele din ModuleCodes de seed-ul din dbo.Modules.
///
/// Un cod prezent în ModuleCodes dar absent sau inactiv în BD nu produce nicio eroare
/// vizibilă: Permission_GetEffectiveByUser filtrează `WHERE m.IsActive = 1`, codul lipsește
/// din dicționarul de permisiuni, iar [HasAccess] pe el refuză TOȚI utilizatorii cu 403 —
/// indistinct de un refuz legitim. Exact situația în care se aflau `reports` și `documents`
/// înainte de migrarea 0057, doar că invers: module active în BD, fără nimic care să le
/// folosească.
///
/// Testele nu modifică baza de date.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class ModuleSeedTests(IntegrationTestFixture fixture)
{
    private static IReadOnlyList<string> ModuleCodeConstants() =>
        typeof(ModuleCodes)
            .GetFields(BindingFlags.Public | BindingFlags.Static | BindingFlags.FlattenHierarchy)
            .Where(f => f.IsLiteral && !f.IsInitOnly && f.FieldType == typeof(string))
            .Select(f => (string)f.GetRawConstantValue()!)
            .ToList();

    private async Task<HashSet<string>> ActiveModuleCodesAsync()
    {
        await using var conn = new SqlConnection(fixture.ConnectionString);
        var codes = await conn.QueryAsync<string>(
            "SELECT Code FROM dbo.Modules WHERE IsActive = 1");
        return codes.ToHashSet(StringComparer.Ordinal);
    }

    [Fact]
    public async Task EveryModuleCodeConstant_ExistsAsActiveModule()
    {
        var active = await ActiveModuleCodesAsync();

        var missing = ModuleCodeConstants().Where(c => !active.Contains(c)).ToList();

        Assert.True(missing.Count == 0,
            $"Coduri din ModuleCodes fără modul activ în dbo.Modules: {string.Join(", ", missing)}. " +
            "Orice [HasAccess] pe ele dă 403 pentru toți utilizatorii, fără niciun indiciu " +
            "despre cauză. Seed-ează modulul într-o migrare sau elimină constanta.");
    }

    /// <summary>
    /// Direcția inversă: un modul activ în BD pe care niciun cod nu-l cunoaște e un drept
    /// acordabil din ecranul de permisiuni care nu deschide nimic — cazul `reports` /
    /// `documents` de dinainte de 0057.
    /// </summary>
    [Fact]
    public async Task EveryActiveModule_HasAModuleCodeConstant()
    {
        var active = await ActiveModuleCodesAsync();
        var known = ModuleCodeConstants().ToHashSet(StringComparer.Ordinal);

        var orphans = active.Where(c => !known.Contains(c)).OrderBy(c => c, StringComparer.Ordinal).ToList();

        Assert.True(orphans.Count == 0,
            $"Module active în BD fără constantă în ModuleCodes: {string.Join(", ", orphans)}. " +
            "Apar ca drepturi acordabile în /permissions/roles fără să existe cod care să le " +
            "verifice. Fie construiește feature-ul și adaugă constanta, fie dezactivează " +
            "modulul (IsActive = 0), ca la migrarea 0057.");
    }

    [Fact]
    public async Task RetiredModules_AreInactive()
    {
        await using var conn = new SqlConnection(fixture.ConnectionString);
        var stillActive = (await conn.QueryAsync<string>(
            "SELECT Code FROM dbo.Modules WHERE IsActive = 1 AND Code IN ('reports', 'documents')"))
            .ToList();

        Assert.True(stillActive.Count == 0,
            $"Module retrase în 0057 dar active: {string.Join(", ", stillActive)}. " +
            "Verifică dacă migrarea 0057 a rulat pe această bază de date.");
    }
}
