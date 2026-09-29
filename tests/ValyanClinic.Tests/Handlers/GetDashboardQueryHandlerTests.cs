using Microsoft.Extensions.Options;
using NSubstitute;
using ValyanClinic.Application.Common.Configuration;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Dashboard.DTOs;
using ValyanClinic.Application.Features.Dashboard.Queries.GetDashboard;
using ValyanClinic.Application.Features.Dashboard.Widgets;
using Xunit;
using W = ValyanClinic.Application.Features.Dashboard.Widgets.DashboardWidgetIds;

namespace ValyanClinic.Tests.Handlers;

/// <summary>
/// Dashboard: preset per rol ∩ permisiuni efective. Testele care contează sunt cele de
/// autorizare — ce ajunge (și ce nu) în SP și în răspuns.
/// </summary>
public sealed class GetDashboardQueryHandlerTests
{
    private static readonly Guid ClinicId = Guid.Parse("A0000058-0000-0000-0000-000000000001");
    private static readonly Guid UserId   = Guid.Parse("B0000058-0000-0000-0000-000000000001");
    private static readonly Guid RoleId   = Guid.Parse("C0000058-0000-0000-0000-000000000001");
    // 15 martie 2026, 22:30 UTC = 16 martie 00:30 la București (UTC+2)
    private static readonly DateTimeOffset NowUtc = new(2026, 3, 15, 22, 30, 0, TimeSpan.Zero);

    private readonly IDashboardRepository  _repo        = Substitute.For<IDashboardRepository>();
    private readonly IEffectivePermissions _permissions = Substitute.For<IEffectivePermissions>();
    private readonly ICurrentUser          _currentUser = Substitute.For<ICurrentUser>();

    public GetDashboardQueryHandlerTests()
    {
        _currentUser.Id.Returns(UserId);
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.RoleId.Returns(RoleId);
        _repo.GetAsync(Arg.Any<DashboardQueryData>(), Arg.Any<CancellationToken>()).Returns(DashboardRawData.Empty);
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    private GetDashboardQueryHandler CreateHandler() => new(
        _repo, _permissions, _currentUser, new FixedTimeProvider(NowUtc),
        Options.Create(new DashboardOptions { TimeZoneId = "Europe/Bucharest", SecurityWindowHours = 24 }));

    private void AsRole(string role, params (string Module, AccessLevel Level)[] levels)
    {
        _currentUser.Role.Returns(role);
        _currentUser.IsInRole(Arg.Any<string>()).Returns(ci => ci.Arg<string>() == role);
        IReadOnlyDictionary<string, int> map = levels.ToDictionary(l => l.Module, l => (int)l.Level);
        _permissions.GetLevelsAsync(UserId, RoleId, Arg.Any<CancellationToken>()).Returns(map);
    }

    // Matricea din seed (0011 + 0045 + 0047 + 0053), doar modulele relevante
    private static readonly (string, AccessLevel)[] DoctorLevels =
    [
        (ModuleCodes.Dashboard, AccessLevel.Read), (ModuleCodes.Patients, AccessLevel.Write),
        (ModuleCodes.Appointments, AccessLevel.Write), (ModuleCodes.Consultations, AccessLevel.Write),
        (ModuleCodes.Prescriptions, AccessLevel.Write), (ModuleCodes.Tariffs, AccessLevel.Read),
    ];

    private static readonly (string, AccessLevel)[] NurseLevels =
    [
        (ModuleCodes.Dashboard, AccessLevel.Read), (ModuleCodes.Patients, AccessLevel.Read),
        (ModuleCodes.Appointments, AccessLevel.Read), (ModuleCodes.Consultations, AccessLevel.Read),
        (ModuleCodes.Prescriptions, AccessLevel.Read),
    ];

    private static readonly (string, AccessLevel)[] ReceptionistLevels =
    [
        (ModuleCodes.Dashboard, AccessLevel.Read), (ModuleCodes.Patients, AccessLevel.Write),
        (ModuleCodes.Appointments, AccessLevel.Full), (ModuleCodes.Invoices, AccessLevel.Write),
        (ModuleCodes.Payments, AccessLevel.Write),
    ];

    private static readonly (string, AccessLevel)[] AdminLevels =
        typeof(ModuleCodes).GetFields()
            .Where(f => f.IsLiteral)
            .Select(f => ((string)f.GetRawConstantValue()!, AccessLevel.Full))
            .ToArray();

    private static readonly string[] FinancialWidgets =
        DashboardWidgetCatalog.All.Values
            .Where(w => w.RequiredModules.Contains(ModuleCodes.Payments) || w.RequiredModules.Contains(ModuleCodes.Invoices))
            .Select(w => w.Id).ToArray();

    // ── Autorizare ───────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_DoctorRole_ReturnsNoFinancialWidgets()
    {
        AsRole(Roles.Doctor, DoctorLevels);

        var result = await CreateHandler().Handle(new GetDashboardQuery(), default);

        Assert.True(result.IsSuccess);
        Assert.DoesNotContain(result.Value!.WidgetIds, id => FinancialWidgets.Contains(id));
        Assert.Contains(W.ListPatientFlowToday, result.Value.WidgetIds);
        Assert.DoesNotContain(W.ListAgendaToday, result.Value.WidgetIds);
        await _repo.Received(1).GetAsync(
            Arg.Is<DashboardQueryData>(q => !q.Bundles.Contains(DashboardBundle.Financial)),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ReceptionistRole_NeverRequestsClinicalData()
    {
        AsRole(Roles.Receptionist, ReceptionistLevels);

        await CreateHandler().Handle(new GetDashboardQuery(), default);

        await _repo.Received(1).GetAsync(
            Arg.Is<DashboardQueryData>(q => !q.IncludeClinical && !q.OnlyMine),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ReceptionistRole_StripsClinicalCountersFromSharedBundle()
    {
        AsRole(Roles.Receptionist, ReceptionistLevels);
        _repo.GetAsync(Arg.Any<DashboardQueryData>(), Arg.Any<CancellationToken>()).Returns(
            DashboardRawData.Empty with
            {
                ClinicalKpis = new DashboardClinicalKpisDto
                {
                    AppointmentsToday = 8, ConsultationsOpen = 5, ConsultationsToday = 3,
                    PrescriptionsDraft = 2, PatientsNewThisMonth = 4,
                },
            });

        var result = await CreateHandler().Handle(new GetDashboardQuery(), default);

        var kpis = result.Value!.ClinicalKpis!;
        Assert.Equal(8, kpis.AppointmentsToday);
        Assert.Equal(4, kpis.PatientsNewThisMonth);
        Assert.Null(kpis.ConsultationsOpen);
        Assert.Null(kpis.ConsultationsToday);
        Assert.Null(kpis.PrescriptionsDraft);
    }

    [Fact]
    public async Task Handle_DoctorWithPaymentsOverride_IncludesFinancialWidget()
    {
        AsRole(Roles.Doctor, [.. DoctorLevels, (ModuleCodes.Payments, AccessLevel.Read)]);

        var result = await CreateHandler().Handle(new GetDashboardQuery(), default);

        Assert.Contains(W.KpiRevenueToday, result.Value!.WidgetIds);
        await _repo.Received(1).GetAsync(
            Arg.Is<DashboardQueryData>(q => q.Bundles.Contains(DashboardBundle.Financial)),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_UserWithoutAnyModule_ReturnsEmptyDashboard_WithoutRepositoryCall()
    {
        AsRole(Roles.Nurse);

        var result = await CreateHandler().Handle(new GetDashboardQuery(), default);

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value!.WidgetIds);
        await _repo.DidNotReceive().GetAsync(Arg.Any<DashboardQueryData>(), Arg.Any<CancellationToken>());
    }

    // ── Scop și bundle-uri ───────────────────────────────────────────────────

    [Fact]
    public async Task Handle_DoctorRole_PassesOnlyMineTrue()
    {
        AsRole(Roles.Doctor, DoctorLevels);

        await CreateHandler().Handle(new GetDashboardQuery(), default);

        await _repo.Received(1).GetAsync(
            Arg.Is<DashboardQueryData>(q => q.OnlyMine && q.IncludeClinical),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_AdminRole_PassesOnlyMineFalse()
    {
        AsRole(Roles.Admin, AdminLevels);

        await CreateHandler().Handle(new GetDashboardQuery(), default);

        await _repo.Received(1).GetAsync(
            Arg.Is<DashboardQueryData>(q => !q.OnlyMine),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_NurseRole_RequestsOnlyClinicalAgendaAndFlowBundles()
    {
        AsRole(Roles.Nurse, NurseLevels);

        await CreateHandler().Handle(new GetDashboardQuery(), default);

        await _repo.Received(1).GetAsync(
            Arg.Is<DashboardQueryData>(q =>
                q.Bundles.SetEquals(new[] { DashboardBundle.Clinical, DashboardBundle.Agenda, DashboardBundle.Flow })
                && !q.IncludeFinancial),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ReceptionistRole_IncludesFinancialStageInFlow()
    {
        AsRole(Roles.Receptionist, ReceptionistLevels);

        await CreateHandler().Handle(new GetDashboardQuery(), default);

        await _repo.Received(1).GetAsync(
            Arg.Is<DashboardQueryData>(q => q.IncludeFinancial && q.Bundles.Contains(DashboardBundle.Flow)),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_NowIsPassedInClinicTimeZone()
    {
        AsRole(Roles.Receptionist, ReceptionistLevels);

        await CreateHandler().Handle(new GetDashboardQuery(), default);

        await _repo.Received(1).GetAsync(
            Arg.Is<DashboardQueryData>(q => q.Now == new DateTime(2026, 3, 16, 0, 30, 0)),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WidgetOrderFollowsPresetAfterFiltering()
    {
        AsRole(Roles.Receptionist, ReceptionistLevels);

        var result = await CreateHandler().Handle(new GetDashboardQuery(), default);

        var expected = DashboardPresets.For(Roles.Receptionist)
            .Where(id => DashboardWidgetCatalog.IsAllowed(
                DashboardWidgetCatalog.All[id],
                ReceptionistLevels.ToDictionary(l => l.Item1, l => (int)l.Item2)))
            .ToList();
        Assert.Equal(expected, result.Value!.WidgetIds);
    }

    [Fact]
    public async Task Handle_UnknownRole_UsesDefaultPreset()
    {
        AsRole("unknown_role", NurseLevels);

        var result = await CreateHandler().Handle(new GetDashboardQuery(), default);

        Assert.Equal(DashboardPresets.DefaultPreset, result.Value!.WidgetIds);
    }

    // ── Timp ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_TodayIsComputedInClinicTimeZone()
    {
        AsRole(Roles.Nurse, NurseLevels);

        var result = await CreateHandler().Handle(new GetDashboardQuery(TrendDays: 45), default);

        Assert.Equal(new DateOnly(2026, 3, 16), result.Value!.Today);
        await _repo.Received(1).GetAsync(
            Arg.Is<DashboardQueryData>(q =>
                q.Today == new DateOnly(2026, 3, 16)
                && q.SinceUtc == NowUtc.UtcDateTime.AddHours(-24)
                && q.TrendDays == 45
                && q.ClinicId == ClinicId
                && q.UserId == UserId),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_SecurityEvents_AreConvertedFromUtcToClinicTime()
    {
        AsRole(Roles.Admin, AdminLevels);
        var occurredUtc = new DateTime(2026, 3, 15, 20, 0, 0);
        _repo.GetAsync(Arg.Any<DashboardQueryData>(), Arg.Any<CancellationToken>()).Returns(
            DashboardRawData.Empty with
            {
                Health = new DashboardHealthDto
                {
                    SecurityEvents = [new DashboardSecurityEventDto { EventType = "LoginFailed", OccurredAt = occurredUtc }],
                    SyncFreshness =
                    [
                        new DashboardSyncFreshnessDto { Source = DashboardSyncSources.Anm },
                        new DashboardSyncFreshnessDto { Source = DashboardSyncSources.Cnas },
                    ],
                },
            });

        var result = await CreateHandler().Handle(new GetDashboardQuery(), default);

        var evt = Assert.Single(result.Value!.Health!.SecurityEvents!);
        Assert.Equal(new DateTime(2026, 3, 15, 22, 0, 0), evt.OccurredAt);
        Assert.Equal(2, result.Value.Health.SyncFreshness!.Count);
    }
}
