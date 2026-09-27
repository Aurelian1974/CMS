using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Features.Dashboard.Widgets;
using Xunit;

namespace ValyanClinic.Tests.Domain;

/// <summary>Consistența catalog ↔ preset-uri ↔ ModuleCodes — erori prinse aici, nu în producție.</summary>
public sealed class DashboardWidgetCatalogTests
{
    private static readonly HashSet<string> KnownModules =
        typeof(ModuleCodes).GetFields()
            .Where(f => f.IsLiteral)
            .Select(f => (string)f.GetRawConstantValue()!)
            .ToHashSet();

    private static readonly HashSet<string> DeclaredIds =
        typeof(DashboardWidgetIds).GetFields()
            .Where(f => f.IsLiteral)
            .Select(f => (string)f.GetRawConstantValue()!)
            .ToHashSet();

    [Fact]
    public void AllPresetIds_ExistInCatalog()
    {
        foreach (var preset in DashboardPresets.AllPresets)
            Assert.All(preset, id => Assert.True(DashboardWidgetCatalog.All.ContainsKey(id), id));
    }

    [Fact]
    public void Presets_HaveNoDuplicates()
    {
        foreach (var preset in DashboardPresets.AllPresets)
            Assert.Equal(preset.Count, preset.Distinct().Count());
    }

    [Fact]
    public void AllCatalogModules_ExistInModuleCodes()
    {
        Assert.All(DashboardWidgetCatalog.All.Values.SelectMany(w => w.RequiredModules),
            m => Assert.Contains(m, KnownModules));
    }

    [Fact]
    public void EveryWidget_DeclaresAtLeastOneModule()
    {
        Assert.All(DashboardWidgetCatalog.All.Values, w => Assert.NotEmpty(w.RequiredModules));
    }

    [Fact]
    public void Catalog_CoversEveryDeclaredWidgetId()
    {
        Assert.Equal(DeclaredIds.OrderBy(x => x), DashboardWidgetCatalog.All.Keys.OrderBy(x => x));
    }

    [Fact]
    public void EveryRole_HasAPreset()
    {
        foreach (var role in new[] { Roles.Admin, Roles.Doctor, Roles.Nurse, Roles.Receptionist, Roles.ClinicManager })
            Assert.NotSame(DashboardPresets.DefaultPreset, DashboardPresets.For(role));
    }
}
