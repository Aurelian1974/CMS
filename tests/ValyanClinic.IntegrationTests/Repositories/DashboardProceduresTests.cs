using System.Data;
using System.Transactions;
using Dapper;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Payments.DTOs;
using ValyanClinic.IntegrationTests.Fixtures;

namespace ValyanClinic.IntegrationTests.Repositories;

/// <summary>
/// SP-urile de dashboard pe baza reală: tenancy, garda pe date clinice, soft delete,
/// seriile completate cu zero, plafonul de zile, calculul restanțelor.
/// Datele de test sunt în 2031 (zi fără date reale), fiecare test într-un
/// TransactionScope nefinalizat — nimic nu rămâne în bază.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class DashboardProceduresTests(IntegrationTestFixture fixture) : IntegrationTestBase(fixture)
{
    private static readonly DateTime TestDay = new(2031, 5, 14);
    private static readonly Guid ExemptVat = Guid.Parse("F1000000-0000-0000-0000-000000000001");
    // Transferul nu emite bon fiscal, deci permite o plată parțială
    private static readonly Guid Transfer  = Guid.Parse("F3000000-0000-0000-0000-000000000003");
    private static readonly Guid Consults  = Guid.Parse("F2000000-0000-0000-0000-000000000001");

    private Guid ClinicId => Fixture.TestClinicId;
    private Guid UserId   => Fixture.TestUserId;
    private static CancellationToken Ct => CancellationToken.None;

    private static TransactionScope NewScope() => new(
        TransactionScopeOption.Required,
        new TransactionOptions { IsolationLevel = System.Transactions.IsolationLevel.ReadCommitted, Timeout = TimeSpan.FromMinutes(1) },
        TransactionScopeAsyncFlowOption.Enabled);

    private static DateTime At(int hour, int minute = 0) => TestDay.Date.AddHours(hour).AddMinutes(minute);

    private async Task<Guid> NewPatientAsync() =>
        await Fixture.GetRepository<IPatientRepository>().CreateAsync(
            clinicId: ClinicId, firstName: TestPrefix + "Ion", lastName: TestPrefix + "Dashboard", cnp: NewTestCnp(),
            birthDate: new DateTime(1980, 1, 1), genderId: null, bloodTypeId: null, phoneNumber: null,
            secondaryPhone: null, email: null, address: "Str. Test 1", city: "București", county: "București",
            postalCode: null, insuranceNumber: null, insuranceExpiry: null, isInsured: false,
            chronicDiseases: null, familyDoctorName: null, notes: null, createdBy: UserId, ct: Ct);

    private async Task<Guid> FirstDoctorAsync() =>
        (await Fixture.GetRepository<IDoctorRepository>().GetByClinicAsync(ClinicId, Ct)).First().Id;

    private Task<Guid> NewAppointmentAsync(Guid patientId, Guid doctorId, int hour, string? notes = null) =>
        Fixture.GetRepository<IAppointmentRepository>().CreateAsync(
            new AppointmentWriteData(ClinicId, patientId, doctorId, At(hour), At(hour, 30), null, notes, false, UserId), Ct);

    private Task<Guid> NewConsultationAsync(Guid patientId, Guid doctorId, Guid statusId, Guid? appointmentId = null) =>
        Fixture.GetRepository<IConsultationRepository>().CreateAsync(
            new ConsultationCreateData(
                ClinicId, patientId, doctorId, appointmentId, At(9),
                null, null, "Text diagnostic", null, null, null, null,
                false, false, false, null, false, null, false, false, null, null,
                statusId),
            UserId, Ct);

    private async Task<SqlMapper.GridReader> ExecAsync(SqlConnection conn, string sp, object param) =>
        await conn.QueryMultipleAsync(new CommandDefinition(sp, param, commandType: CommandType.StoredProcedure));

    private async Task<dynamic> ClinicalKpisAsync(Guid clinicId, Guid? userId = null, bool onlyMine = false)
    {
        await using var conn = new SqlConnection(Fixture.ConnectionString);
        return await conn.QuerySingleAsync("dbo.Dashboard_GetClinicalKpis",
            new { ClinicId = clinicId, UserId = userId ?? UserId, Today = TestDay.Date, OnlyMine = onlyMine },
            commandType: CommandType.StoredProcedure);
    }

    private sealed record AgendaResult(List<dynamic> Agenda, List<dynamic> Open, List<dynamic> Labs);

    private async Task<AgendaResult> AgendaAsync(bool includeClinical)
    {
        await using var conn = new SqlConnection(Fixture.ConnectionString);
        using var multi = await ExecAsync(conn, "dbo.Dashboard_GetAgenda",
            new { ClinicId, UserId, Today = TestDay.Date, OnlyMine = false, IncludeClinical = includeClinical, Top = 50 });
        return new AgendaResult(
            (await multi.ReadAsync()).ToList(),
            (await multi.ReadAsync()).ToList(),
            (await multi.ReadAsync()).ToList());
    }

    // ── Clinical KPIs ────────────────────────────────────────────────────────

    [Fact]
    public async Task ClinicalKpis_CountsOnlyActiveAppointmentsOfTheDay()
    {
        using var scope = NewScope();
        var patientId = await NewPatientAsync();
        var doctorId = await FirstDoctorAsync();
        var repo = Fixture.GetRepository<IAppointmentRepository>();

        await NewAppointmentAsync(patientId, doctorId, 9);
        var cancelled = await NewAppointmentAsync(patientId, doctorId, 10);
        var deleted = await NewAppointmentAsync(patientId, doctorId, 11);
        await repo.UpdateStatusAsync(cancelled, ClinicId, AppointmentStatusIds.Cancelled, UserId, Ct);
        await repo.DeleteAsync(deleted, ClinicId, UserId, Ct);

        var kpis = await ClinicalKpisAsync(ClinicId);

        Assert.Equal(1, (int)kpis.AppointmentsToday);
        Assert.Equal(1, (int)kpis.AppointmentsTodayRemaining);
    }

    [Fact]
    public async Task ClinicalKpis_OtherClinic_SeesNothing()
    {
        using var scope = NewScope();
        var patientId = await NewPatientAsync();
        await NewAppointmentAsync(patientId, await FirstDoctorAsync(), 9);

        var kpis = await ClinicalKpisAsync(Guid.NewGuid());

        Assert.Equal(0, (int)kpis.AppointmentsToday);
        Assert.Equal(0, (int)kpis.ConsultationsOpen);
        Assert.Equal(0, (int)kpis.PatientsNewThisMonth);
    }

    [Fact]
    public async Task ClinicalKpis_OnlyMineForUserWithoutDoctor_FallsBackToClinic()
    {
        using var scope = NewScope();
        var patientId = await NewPatientAsync();
        await NewAppointmentAsync(patientId, await FirstDoctorAsync(), 9);

        var mine = await ClinicalKpisAsync(ClinicId, userId: Guid.NewGuid(), onlyMine: true);
        var clinic = await ClinicalKpisAsync(ClinicId);

        Assert.Equal((int)clinic.AppointmentsToday, (int)mine.AppointmentsToday);
        Assert.Equal((int)clinic.ConsultationsOpen, (int)mine.ConsultationsOpen);
    }

    [Fact]
    public async Task ClinicalKpis_OnlyMineForDoctorUser_FiltersToThatDoctor()
    {
        using var scope = NewScope();
        await using var conn = new SqlConnection(Fixture.ConnectionString);
        var link = await conn.QueryFirstOrDefaultAsync<(Guid UserId, Guid DoctorId)?>(
            "SELECT TOP (1) Id, DoctorId FROM dbo.Users WHERE ClinicId = @ClinicId AND DoctorId IS NOT NULL AND IsDeleted = 0",
            new { ClinicId });
        if (link is null) return;   // baza nu are niciun cont legat de un medic

        var otherDoctor = (await Fixture.GetRepository<IDoctorRepository>().GetByClinicAsync(ClinicId, Ct))
            .Select(d => d.Id).FirstOrDefault(id => id != link.Value.DoctorId);
        if (otherDoctor == Guid.Empty) return;

        var patientId = await NewPatientAsync();
        await NewAppointmentAsync(patientId, otherDoctor, 9);

        var mine = await ClinicalKpisAsync(ClinicId, link.Value.UserId, onlyMine: true);

        Assert.Equal(0, (int)mine.AppointmentsToday);
    }

    // ── Agenda: garda pe date clinice ────────────────────────────────────────

    [Fact]
    public async Task Agenda_WithoutClinical_NullsNotesAndEmptiesClinicalLists()
    {
        using var scope = NewScope();
        var patientId = await NewPatientAsync();
        var doctorId = await FirstDoctorAsync();
        var appointmentId = await NewAppointmentAsync(patientId, doctorId, 9, notes: "Durere toracică");
        await NewConsultationAsync(patientId, doctorId, ConsultationStatusIds.InProgress, appointmentId);

        var result = await AgendaAsync(includeClinical: false);

        var row = Assert.Single(result.Agenda, a => (Guid)a.Id == appointmentId);
        Assert.Null(row.Notes);
        Assert.Empty(result.Open);
        Assert.Empty(result.Labs);
    }

    [Fact]
    public async Task Agenda_WithClinical_ReturnsNotesAndOpenConsultation()
    {
        using var scope = NewScope();
        var patientId = await NewPatientAsync();
        var doctorId = await FirstDoctorAsync();
        var appointmentId = await NewAppointmentAsync(patientId, doctorId, 9, notes: "Durere toracică");
        var consultationId = await NewConsultationAsync(patientId, doctorId, ConsultationStatusIds.InProgress, appointmentId);

        var result = await AgendaAsync(includeClinical: true);

        var row = Assert.Single(result.Agenda, a => (Guid)a.Id == appointmentId);
        Assert.Equal("Durere toracică", (string)row.Notes);
        Assert.Equal(consultationId, (Guid)row.ConsultationId);
        var open = Assert.Single(result.Open, c => (Guid)c.Id == consultationId);
        Assert.Equal("Text diagnostic", (string)open.Diagnostic);
    }

    // ── Trends ───────────────────────────────────────────────────────────────

    [Theory]
    [InlineData(30, 30)]
    [InlineData(500, 180)]
    public async Task Trends_ReturnOneRowPerDay_ZeroFilled_AndCapped(int days, int expectedRows)
    {
        await using var conn = new SqlConnection(Fixture.ConnectionString);
        using var multi = await ExecAsync(conn, "dbo.Dashboard_GetTrends",
            new { ClinicId = Guid.NewGuid(), Today = new DateTime(2035, 1, 15), Days = days });

        var revenue = (await multi.ReadAsync()).ToList();
        var appointments = (await multi.ReadAsync()).ToList();
        var noShow = await multi.ReadSingleAsync();
        var workload = (await multi.ReadAsync()).ToList();

        Assert.Equal(expectedRows, revenue.Count);
        Assert.Equal(expectedRows, appointments.Count);
        Assert.All(revenue, r => Assert.Equal(0m, (decimal)r.Amount));
        Assert.Equal(new DateTime(2035, 1, 15), (DateTime)revenue[^1].Date);
        Assert.Equal(0, (int)noShow.TotalScheduled);
        Assert.Empty(workload);
    }

    // ── Financial ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Financial_OutstandingFollowsServicesMinusPayments()
    {
        using var scope = NewScope();
        var suffix = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
        var serviceId = await Fixture.GetRepository<ITariffRepository>().CreateAsync(
            new MedicalServiceCreateData(ClinicId, $"IT-D-{suffix}", TestPrefix + "Consultație", Consults,
                30, null, 100m, ExemptVat, null), UserId, Ct);
        var patientId = await NewPatientAsync();
        var consultationId = await NewConsultationAsync(patientId, await FirstDoctorAsync(), ConsultationStatusIds.Completed);
        await Fixture.GetRepository<IConsultationServiceRepository>()
            .AddAsync(ClinicId, consultationId, serviceId, 1m, UserId, Ct);

        var before = await FinancialAsync();
        var unpaid = Assert.Single(before.Unpaid, u => (Guid)u.ConsultationId == consultationId);
        Assert.Equal(100m, (decimal)unpaid.Balance);
        Assert.Equal(PaymentStatusCodes.Unpaid, (string)unpaid.PaymentStatus);

        await Fixture.GetRepository<IPaymentRepository>().CreateAsync(
            ClinicId, consultationId, Guid.NewGuid(), [new PaymentTenderInput(Transfer, 40m)], null, UserId, Ct);

        var after = await FinancialAsync();
        var partial = Assert.Single(after.Unpaid, u => (Guid)u.ConsultationId == consultationId);
        Assert.Equal(60m, (decimal)partial.Balance);
        Assert.Equal(PaymentStatusCodes.Partial, (string)partial.PaymentStatus);
        Assert.Equal((decimal)before.Kpis.OutstandingTotal - 40m, (decimal)after.Kpis.OutstandingTotal);
    }

    [Fact]
    public async Task Financial_OtherClinic_SeesNothing()
    {
        await using var conn = new SqlConnection(Fixture.ConnectionString);
        using var multi = await ExecAsync(conn, "dbo.Dashboard_GetFinancialKpis",
            new { ClinicId = Guid.NewGuid(), Today = TestDay.Date, Top = 10 });

        var kpis = await multi.ReadSingleAsync();
        Assert.Equal(0m, (decimal)kpis.RevenueThisMonth);
        Assert.Equal(0, (int)kpis.UnpaidCount);
        Assert.Empty(await multi.ReadAsync());
        Assert.Empty(await multi.ReadAsync());
    }

    private sealed record FinancialResult(dynamic Kpis, List<dynamic> Unpaid);

    private async Task<FinancialResult> FinancialAsync()
    {
        await using var conn = new SqlConnection(Fixture.ConnectionString);
        using var multi = await ExecAsync(conn, "dbo.Dashboard_GetFinancialKpis",
            new { ClinicId, Today = TestDay.Date, Top = 100 });
        var kpis = await multi.ReadSingleAsync();
        var unpaid = (await multi.ReadAsync()).ToList();
        await multi.ReadAsync();
        return new FinancialResult(kpis, unpaid);
    }

    // ── Health ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Health_ReturnsFiveResultSets_WithBothNomenclatorSources()
    {
        await using var conn = new SqlConnection(Fixture.ConnectionString);
        using var multi = await ExecAsync(conn, "dbo.Dashboard_GetOperationalHealth",
            new { ClinicId, Today = TestDay.Date, SinceUtc = DateTime.UtcNow.AddDays(-1), ExpiryDays = 60, Top = 15 });

        await multi.ReadAsync();
        await multi.ReadAsync();
        await multi.ReadAsync();
        await multi.ReadAsync();
        var freshness = (await multi.ReadAsync()).Select(r => (string)r.Source).ToList();

        Assert.Equal(["ANM", "CNAS"], freshness);
    }
}
