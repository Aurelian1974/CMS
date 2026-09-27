using System.Reflection;
using ValyanClinic.Application.Common.Constants;
using Xunit;

namespace ValyanClinic.Tests.Domain;

/// <summary>
/// Teste de consistență pe ModuleCodes.
///
/// Un cod de modul greșit nu produce o eroare de compilare și nici un mesaj la rulare:
/// ModuleAccessAuthorizationHandler caută codul într-un Dictionary&lt;string, int&gt; cu
/// comparatorul ordinal implicit, iar o cheie negăsită înseamnă „fără permisiune" → 403
/// tăcut, identic cu un refuz legitim. Testele de mai jos prind formele greșite care duc
/// acolo, înainte de deploy.
///
/// Corespondența cu dbo.Modules (fiecare cod există și e activ) nu poate fi verificată
/// fără bază de date — vezi ModuleSeedTests din ValyanClinic.IntegrationTests.
/// </summary>
public sealed class ModuleCodesTests
{
    private static IReadOnlyList<(string Name, string Value)> AllCodes() =>
        typeof(ModuleCodes)
            .GetFields(BindingFlags.Public | BindingFlags.Static | BindingFlags.FlattenHierarchy)
            .Where(f => f.IsLiteral && !f.IsInitOnly && f.FieldType == typeof(string))
            .Select(f => (Name: f.Name, Value: (string)f.GetRawConstantValue()!))
            .ToList();

    [Fact]
    public void AllCodes_AreUnique()
    {
        var duplicates = AllCodes()
            .GroupBy(c => c.Value, StringComparer.Ordinal)
            .Where(g => g.Count() > 1)
            .Select(g => $"{g.Key} ({string.Join(", ", g.Select(x => x.Name))})")
            .ToList();

        Assert.True(duplicates.Count == 0,
            $"Coduri de modul duplicate: {string.Join("; ", duplicates)}. " +
            "Două constante cu aceeași valoare înseamnă că o gardă nu face ce spune numele ei.");
    }

    [Fact]
    public void AllCodes_AreLowercaseAndTrimmed()
    {
        foreach (var (name, value) in AllCodes())
        {
            Assert.False(string.IsNullOrWhiteSpace(value),
                $"ModuleCodes.{name} este gol.");
            Assert.Equal(value.Trim(), value);
            Assert.Equal(value.ToLowerInvariant(), value);
        }
    }

    /// <summary>
    /// `reports` și `documents` au fost retrase în migrarea 0057 (module seed-uite în 0011
    /// pentru feature-uri neconstruite, dezactivate cu IsActive = 0). O reintroducere aici
    /// fără reactivarea din BD ar da 403 tăcut pe orice endpoint păzit de ele.
    /// </summary>
    [Theory]
    [InlineData("reports")]
    [InlineData("documents")]
    public void RetiredModules_AreNotReintroduced(string retiredCode)
    {
        var reintroduced = AllCodes().FirstOrDefault(c => c.Value == retiredCode);

        Assert.True(reintroduced.Name is null,
            $"ModuleCodes.{reintroduced.Name} readuce modulul retras '{retiredCode}'. " +
            "Dacă feature-ul se construiește acum: reactivează modulul în BD " +
            "(UPDATE dbo.Modules SET IsActive = 1), adaugă codul și în MODULE din " +
            "client/src/hooks/useHasAccess.ts, apoi șterge cazul corespunzător din acest test.");
    }
}
