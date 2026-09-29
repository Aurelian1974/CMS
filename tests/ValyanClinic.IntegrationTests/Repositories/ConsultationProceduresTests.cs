using System.Transactions;
using Dapper;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Consultations.DTOs;
using ValyanClinic.IntegrationTests.Fixtures;

namespace ValyanClinic.IntegrationTests.Repositories;

/// <summary>
/// Regulile din SP-urile de consultații pe baza reală: tenancy pe cheile străine,
/// o consultație per programare, sincronizarea ConsultationDiagnoses, finalizare,
/// read-only după finalizare, căutare cu metacaractere LIKE.
/// Fiecare test rulează într-un TransactionScope nefinalizat; o eroare aruncată de SP
/// anulează tranzacția ambientală, deci verificarea erorii e mereu ultimul pas.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class ConsultationProceduresTests(IntegrationTestFixture fixture) : IntegrationTestBase(fixture)
{
    private static readonly DateTime TestDay = new(2031, 6, 9);

    private IConsultationRepository Consultations => Fixture.GetRepository<IConsultationRepository>();
    private Guid ClinicId => Fixture.TestClinicId;
    private Guid UserId   => Fixture.TestUserId;
    private static CancellationToken Ct => CancellationToken.None;

    private static TransactionScope NewScope() => new(
        TransactionScopeOption.Required,
        new TransactionOptions { IsolationLevel = IsolationLevel.ReadCommitted, Timeout = TimeSpan.FromMinutes(1) },
        TransactionScopeAsyncFlowOption.Enabled);

    private async Task<Guid> NewPatientAsync(string lastName = "Consultatie") =>
        await Fixture.GetRepository<IPatientRepository>().CreateAsync(
            clinicId: ClinicId, firstName: TestPrefix + "Ion", lastName: TestPrefix + lastName, cnp: NewTestCnp(),
            birthDate: new DateTime(1980, 1, 1), genderId: null, bloodTypeId: null, phoneNumber: null,
            secondaryPhone: null, email: null, address: "Str. Test 1", city: "București", county: "București",
            postalCode: null, insuranceNumber: null, insuranceExpiry: null, isInsured: false,
            chronicDiseases: null, familyDoctorName: null, notes: null, createdBy: UserId, ct: Ct);

    private async Task<Guid> FirstDoctorAsync() =>
        (await Fixture.GetRepository<IDoctorRepository>().GetByClinicAsync(ClinicId, Ct)).First().Id;

    private Task<Guid> NewAppointmentAsync(Guid patientId, Guid doctorId) =>
        Fixture.GetRepository<IAppointmentRepository>().CreateAsync(
            new AppointmentWriteData(ClinicId, patientId, doctorId,
                TestDay.AddHours(10), TestDay.AddHours(10).AddMinutes(30), null, null, false, UserId), Ct);

    private ConsultationCreateData Data(Guid patientId, Guid doctorId, Guid? appointmentId = null, string? diagnostic = null) =>
        new(ClinicId, patientId, doctorId, appointmentId, TestDay,
            null, null, diagnostic, null, null, null, null,
            false, false, false, null, false, null, false, false, null, null);

    private static ConsultationUpdateData ToUpdate(Guid id, ConsultationCreateData d) =>
        new(id, d.ClinicId, d.PatientId, d.DoctorId, d.AppointmentId, d.Date,
            d.Investigatii, d.AnalizeMedicale, d.Diagnostic, d.DiagnosticCodes, d.Recomandari, d.Observatii,
            d.Concluzii, d.EsteAfectiuneOncologica, d.AreIndicatieInternare, d.SaEliberatPrescriptie,
            d.SeriePrescriptie, d.SaEliberatConcediuMedical, d.SerieConcediuMedical,
            d.SaEliberatIngrijiriDomiciliu, d.SaEliberatDispozitiveMedicale,
            d.DataUrmatoareiVizite, d.NoteUrmatoareaVizita);

    private async Task<List<(string Code, bool IsPrimary, int GroupNo)>> DiagnosesOf(Guid consultationId)
    {
        await using var conn = new SqlConnection(Fixture.ConnectionString);
        var rows = await conn.QueryAsync<(string, bool, int)>(
            "SELECT Icd10Code, IsPrimary, GroupNo FROM dbo.ConsultationDiagnoses WHERE ConsultationId = @Id ORDER BY SortOrder, IsPrimary DESC",
            new { Id = consultationId });
        return rows.ToList();
    }

    private static async Task<int> SqlErrorOf(Func<Task> act)
    {
        var ex = await Assert.ThrowsAsync<SqlException>(act);
        return ex.Number;
    }

    // ── Tenancy ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_PatientNotInClinic_Throws50002()
    {
        using var scope = NewScope();
        var doctorId = await FirstDoctorAsync();

        var number = await SqlErrorOf(() => Consultations.CreateAsync(Data(Guid.NewGuid(), doctorId), UserId, Ct));

        Assert.Equal(SqlErrorCodes.PatientNotFound, number);
    }

    [Fact]
    public async Task Create_DoctorNotInClinic_Throws50300()
    {
        using var scope = NewScope();
        var patientId = await NewPatientAsync();

        var number = await SqlErrorOf(() => Consultations.CreateAsync(Data(patientId, Guid.NewGuid()), UserId, Ct));

        Assert.Equal(SqlErrorCodes.DoctorNotFound, number);
    }

    [Fact]
    public async Task Create_AppointmentOfAnotherPatient_Throws50011()
    {
        using var scope = NewScope();
        var doctorId = await FirstDoctorAsync();
        var owner = await NewPatientAsync("Owner");
        var other = await NewPatientAsync("Other");
        var appointmentId = await NewAppointmentAsync(owner, doctorId);

        var number = await SqlErrorOf(() => Consultations.CreateAsync(Data(other, doctorId, appointmentId), UserId, Ct));

        Assert.Equal(SqlErrorCodes.AppointmentNotFound, number);
    }

    // ── Serviciu de consultație automat ──────────────────────────────────────

    [Fact]
    public async Task Create_AddsConsServiceLineWithCurrentPrice()
    {
        using var scope = NewScope();
        await using (var conn = new SqlConnection(Fixture.ConnectionString))
        {
            await conn.ExecuteAsync(
                "UPDATE dbo.MedicalServices SET IsDeleted = 1 WHERE ClinicId = @ClinicId AND Code = N'CONS' AND IsDeleted = 0",
                new { ClinicId });
        }
        var serviceId = await Fixture.GetRepository<ITariffRepository>().CreateAsync(
            new MedicalServiceCreateData(ClinicId, "CONS", TestPrefix + "Consultație",
                Guid.Parse("F2000000-0000-0000-0000-000000000001"), 30, null, 123m,
                Guid.Parse("F1000000-0000-0000-0000-000000000001"), null), UserId, Ct);

        var id = await Consultations.CreateAsync(Data(await NewPatientAsync(), await FirstDoctorAsync()), UserId, Ct);

        var line = Assert.Single(await Fixture.GetRepository<IConsultationServiceRepository>()
            .GetByConsultationAsync(id, ClinicId, Ct));
        Assert.Equal(serviceId, line.MedicalServiceId);
        Assert.Equal(123m, line.UnitPrice);
        Assert.Equal(1m, line.Quantity);
    }

    [Fact]
    public async Task Create_NoActiveConsService_CreatesConsultationWithoutLines()
    {
        using var scope = NewScope();
        await using (var conn = new SqlConnection(Fixture.ConnectionString))
        {
            await conn.ExecuteAsync(
                "UPDATE dbo.MedicalServices SET IsDeleted = 1 WHERE ClinicId = @ClinicId AND Code = N'CONS' AND IsDeleted = 0",
                new { ClinicId });
        }

        var id = await Consultations.CreateAsync(Data(await NewPatientAsync(), await FirstDoctorAsync()), UserId, Ct);

        Assert.Empty(await Fixture.GetRepository<IConsultationServiceRepository>()
            .GetByConsultationAsync(id, ClinicId, Ct));
    }

    [Fact]
    public async Task Update_PatientNotInClinic_Throws50002()
    {
        using var scope = NewScope();
        var doctorId = await FirstDoctorAsync();
        var data = Data(await NewPatientAsync(), doctorId);
        var id = await Consultations.CreateAsync(data, UserId, Ct);

        var number = await SqlErrorOf(() =>
            Consultations.UpdateAsync(ToUpdate(id, data) with { PatientId = Guid.NewGuid() }, UserId, Ct));

        Assert.Equal(SqlErrorCodes.PatientNotFound, number);
    }

    // ── O consultație per programare ─────────────────────────────────────────

    [Fact]
    public async Task Create_SecondConsultationForSameAppointment_Throws50033()
    {
        using var scope = NewScope();
        var doctorId = await FirstDoctorAsync();
        var patientId = await NewPatientAsync();
        var appointmentId = await NewAppointmentAsync(patientId, doctorId);
        await Consultations.CreateAsync(Data(patientId, doctorId, appointmentId), UserId, Ct);

        var number = await SqlErrorOf(() => Consultations.CreateAsync(Data(patientId, doctorId, appointmentId), UserId, Ct));

        Assert.Equal(SqlErrorCodes.ConsultationAppointmentDuplicate, number);
    }

    // ── Diagnostice normalizate ──────────────────────────────────────────────

    [Fact]
    public async Task Create_WithIcdJson_SyncsPrimaryAndSecondaryCodes()
    {
        using var scope = NewScope();
        var id = await Consultations.CreateAsync(
            Data(await NewPatientAsync(), await FirstDoctorAsync(), diagnostic: DiagnosisJson), UserId, Ct);

        var rows = await DiagnosesOf(id);

        Assert.Equal(("J44.0", true, 0), rows[0]);
        Assert.Equal([("I10", false, 1), ("J41.0", false, 1)], rows.Skip(1).ToList());
    }

    [Fact]
    public async Task Update_ToPlainText_RemovesCodes()
    {
        using var scope = NewScope();
        var data = Data(await NewPatientAsync(), await FirstDoctorAsync(), diagnostic: DiagnosisJson);
        var id = await Consultations.CreateAsync(data, UserId, Ct);

        await Consultations.UpdateAsync(ToUpdate(id, data) with { Diagnostic = "Text liber" }, UserId, Ct);

        Assert.Empty(await DiagnosesOf(id));
    }

    [Fact]
    public async Task Create_WithDiagnosticOver4000Chars_Succeeds()
    {
        using var scope = NewScope();
        var longJson = DiagnosisJson.Replace("<p>BPOC exacerbat</p>", "<p>" + new string('x', 9000) + "</p>");

        var id = await Consultations.CreateAsync(
            Data(await NewPatientAsync(), await FirstDoctorAsync(), diagnostic: longJson), UserId, Ct);

        Assert.Equal(3, (await DiagnosesOf(id)).Count);
    }

    // ── Finalizare ───────────────────────────────────────────────────────────

    [Fact]
    public async Task Finalize_WithPrimaryDiagnosis_SetsFinalizedStatus()
    {
        using var scope = NewScope();
        var id = await Consultations.CreateAsync(
            Data(await NewPatientAsync(), await FirstDoctorAsync(), diagnostic: DiagnosisJson), UserId, Ct);

        await Consultations.FinalizeAsync(id, ClinicId, UserId, Ct);

        var detail = await Consultations.GetByIdAsync(id, ClinicId, Ct);
        Assert.Equal(ConsultationStatusCodes.Completed, detail!.StatusCode);
    }

    [Fact]
    public async Task Finalize_WithoutPrimaryDiagnosis_Throws50034()
    {
        using var scope = NewScope();
        var id = await Consultations.CreateAsync(
            Data(await NewPatientAsync(), await FirstDoctorAsync(), diagnostic: "Text liber"), UserId, Ct);

        var number = await SqlErrorOf(() => Consultations.FinalizeAsync(id, ClinicId, UserId, Ct));

        Assert.Equal(SqlErrorCodes.ConsultationMissingPrimaryDiagnosis, number);
    }

    [Fact]
    public async Task Finalize_Twice_Throws50021()
    {
        using var scope = NewScope();
        var id = await Consultations.CreateAsync(
            Data(await NewPatientAsync(), await FirstDoctorAsync(), diagnostic: DiagnosisJson), UserId, Ct);
        await Consultations.FinalizeAsync(id, ClinicId, UserId, Ct);

        var number = await SqlErrorOf(() => Consultations.FinalizeAsync(id, ClinicId, UserId, Ct));

        Assert.Equal(SqlErrorCodes.ConsultationLocked, number);
    }

    [Fact]
    public async Task UpsertAnamnesis_AfterFinalize_Throws50021()
    {
        using var scope = NewScope();
        var id = await Consultations.CreateAsync(
            Data(await NewPatientAsync(), await FirstDoctorAsync(), diagnostic: DiagnosisJson), UserId, Ct);
        await Consultations.FinalizeAsync(id, ClinicId, UserId, Ct);

        var number = await SqlErrorOf(() => Consultations.UpsertAnamnesisAsync(
            id, ClinicId, new ConsultationAnamnesisDto { Motiv = "Tuse" }, UserId, Ct));

        Assert.Equal(SqlErrorCodes.ConsultationLocked, number);
    }

    [Fact]
    public async Task UpsertAnamnesis_WritesOldAndNewValuesToAudit()
    {
        using var scope = NewScope();
        var id = await Consultations.CreateAsync(Data(await NewPatientAsync(), await FirstDoctorAsync()), UserId, Ct);
        await Consultations.UpsertAnamnesisAsync(id, ClinicId, new ConsultationAnamnesisDto { Motiv = "Tuse" }, UserId, Ct);
        await Consultations.UpsertAnamnesisAsync(id, ClinicId, new ConsultationAnamnesisDto { Motiv = "Febră" }, UserId, Ct);

        await using var conn = new SqlConnection(Fixture.ConnectionString);
        var last = await conn.QueryFirstAsync<(string? OldValues, string? NewValues)>(
            """
            SELECT TOP 1 OldValues, NewValues FROM dbo.AuditLogs
            WHERE EntityType = N'ConsultationAnamnesis' AND EntityId = @Id
            ORDER BY ChangedAt DESC, Id DESC
            """, new { Id = id });

        Assert.Contains("Tuse", last.OldValues);
        Assert.Contains("Febră", last.NewValues);
    }

    // ── Listare ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetPaged_SearchWithUnderscore_IsLiteral()
    {
        using var scope = NewScope();
        var doctorId = await FirstDoctorAsync();
        var marker = Guid.NewGuid().ToString("N")[..6];
        await Consultations.CreateAsync(Data(await NewPatientAsync($"A_{marker}"), doctorId), UserId, Ct);
        await Consultations.CreateAsync(Data(await NewPatientAsync($"AB{marker}"), doctorId), UserId, Ct);

        var result = await Consultations.GetPagedAsync(
            ClinicId, $"A_{marker}", null, null, null, null, null, 1, 20, "Date", "desc", Ct);

        var row = Assert.Single(result.Paged.Items);
        Assert.Contains($"A_{marker}", row.PatientName);
        Assert.Equal(1, result.Stats.TotalConsultations);
    }

    [Fact]
    public async Task GetPaged_SearchByIcdCode_FindsConsultation()
    {
        using var scope = NewScope();
        var id = await Consultations.CreateAsync(
            Data(await NewPatientAsync(), await FirstDoctorAsync(), diagnostic: DiagnosisJson), UserId, Ct);

        var result = await Consultations.GetPagedAsync(
            ClinicId, "J41.0", null, null, null, TestDay, TestDay, 1, 200, "Date", "desc", Ct);

        Assert.Contains(result.Paged.Items, c => c.Id == id);
    }

    [Fact]
    public async Task GetPaged_FilterByStatusCode_ReturnsOnlyThatStatus()
    {
        using var scope = NewScope();
        var doctorId = await FirstDoctorAsync();
        var draft = await Consultations.CreateAsync(Data(await NewPatientAsync(), doctorId), UserId, Ct);
        var done = await Consultations.CreateAsync(Data(await NewPatientAsync(), doctorId, diagnostic: DiagnosisJson), UserId, Ct);
        await Consultations.FinalizeAsync(done, ClinicId, UserId, Ct);

        var result = await Consultations.GetPagedAsync(
            ClinicId, null, null, null, ConsultationStatusCodes.Completed, TestDay, TestDay, 1, 200, "Date", "desc", Ct);

        Assert.Contains(result.Paged.Items, c => c.Id == done);
        Assert.DoesNotContain(result.Paged.Items, c => c.Id == draft);
        Assert.All(result.Paged.Items, c => Assert.Equal(ConsultationStatusCodes.Completed, c.StatusCode));
    }

    [Fact]
    public async Task GetPaged_InvalidPaging_IsClamped()
    {
        using var scope = NewScope();

        var result = await Consultations.GetPagedAsync(
            ClinicId, null, null, null, null, null, null, 0, 100_000, "Nope", "sideways", Ct);

        Assert.True(result.Paged.Items.Count <= 200);
    }
}
