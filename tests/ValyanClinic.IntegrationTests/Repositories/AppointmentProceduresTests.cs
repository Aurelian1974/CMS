using System.Transactions;
using Dapper;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.IntegrationTests.Fixtures;

namespace ValyanClinic.IntegrationTests.Repositories;

/// <summary>
/// Regulile din SP-urile de programări, pe baza reală: tenancy, conflict serializat,
/// BlocksSlot, program de lucru, tranziții de status, audit, concurență optimistă,
/// integritate cu consultațiile, paginare/statistici/căutare.
/// Fiecare test rulează într-un TransactionScope nefinalizat — nimic nu rămâne în bază.
/// O eroare aruncată de SP (XACT_ABORT) anulează tranzacția ambientală, deci verificarea
/// care așteaptă eroarea este mereu ultimul pas. Excepție: testul de concurență, care
/// are nevoie de două conexiuni independente și își curăță explicit datele.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class AppointmentProceduresTests(IntegrationTestFixture fixture) : IntegrationTestBase(fixture)
{
    // Luni, departe în viitor — fără coliziuni cu datele existente
    private static readonly DateTime TestDay = new(2031, 3, 3);
    private const byte TestDayOfWeek = 1;

    private IAppointmentRepository Appointments => Fixture.GetRepository<IAppointmentRepository>();
    private Guid ClinicId => Fixture.TestClinicId;
    private Guid UserId   => Fixture.TestUserId;
    private static CancellationToken Ct => CancellationToken.None;

    private static TransactionScope NewScope() => new(
        TransactionScopeOption.Required,
        new TransactionOptions { IsolationLevel = IsolationLevel.ReadCommitted, Timeout = TimeSpan.FromMinutes(1) },
        TransactionScopeAsyncFlowOption.Enabled);

    private static DateTime At(int hour, int minute = 0, DateTime? day = null) =>
        (day ?? TestDay).Date.AddHours(hour).AddMinutes(minute);

    private AppointmentWriteData Data(
        Guid patientId, Guid doctorId, DateTime start, DateTime end,
        Guid? statusId = null, string? notes = null, bool enforceSchedule = false) =>
        new(ClinicId, patientId, doctorId, start, end, statusId, notes, enforceSchedule, UserId);

    private async Task<Guid> NewPatientAsync() =>
        await Fixture.GetRepository<IPatientRepository>().CreateAsync(
            clinicId: ClinicId, firstName: TestPrefix + "Ion", lastName: TestPrefix + "Programare", cnp: NewTestCnp(),
            birthDate: new DateTime(1980, 1, 1), genderId: null, bloodTypeId: null, phoneNumber: null,
            secondaryPhone: null, email: null, address: "Str. Test 1", city: "București", county: "București",
            postalCode: null, insuranceNumber: null, insuranceExpiry: null, isInsured: false,
            chronicDiseases: null, familyDoctorName: null, notes: null, createdBy: UserId, ct: Ct);

    private async Task<List<Guid>> DoctorIdsAsync() =>
        (await Fixture.GetRepository<IDoctorRepository>().GetByClinicAsync(ClinicId, Ct)).Select(d => d.Id).ToList();

    private async Task<T> ScalarAsync<T>(string sql, object param)
    {
        await using var conn = new SqlConnection(Fixture.ConnectionString);
        return await conn.ExecuteScalarAsync<T>(sql, param);
    }

    private async Task ExecAsync(string sql, object param)
    {
        await using var conn = new SqlConnection(Fixture.ConnectionString);
        await conn.ExecuteAsync(sql, param);
    }

    private static async Task<int> SqlErrorOf(Func<Task> act)
    {
        var ex = await Assert.ThrowsAsync<SqlException>(act);
        return ex.Number;
    }

    // ── Tenancy ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_PatientFromAnotherClinic_Throws50012()
    {
        using var scope = NewScope();
        var doctorId = (await DoctorIdsAsync()).First();

        var number = await SqlErrorOf(() => Appointments.CreateAsync(Data(Guid.NewGuid(), doctorId, At(10), At(10, 30)), Ct));

        Assert.Equal(SqlErrorCodes.AppointmentPatientNotInClinic, number);
    }

    [Fact]
    public async Task Create_DoctorFromAnotherClinic_Throws50013()
    {
        using var scope = NewScope();
        var patientId = await NewPatientAsync();

        var number = await SqlErrorOf(() => Appointments.CreateAsync(Data(patientId, Guid.NewGuid(), At(10), At(10, 30)), Ct));

        Assert.Equal(SqlErrorCodes.AppointmentDoctorNotInClinic, number);
    }

    // ── Conflict + BlocksSlot ────────────────────────────────────────────────

    [Fact]
    public async Task Create_OverlappingSameDoctor_Throws50010()
    {
        using var scope = NewScope();
        var patientId = await NewPatientAsync();
        var doctorId = (await DoctorIdsAsync()).First();
        await Appointments.CreateAsync(Data(patientId, doctorId, At(10), At(10, 30)), Ct);

        var number = await SqlErrorOf(() => Appointments.CreateAsync(Data(patientId, doctorId, At(10, 15), At(10, 45)), Ct));

        Assert.Equal(SqlErrorCodes.AppointmentConflict, number);
    }

    [Fact]
    public async Task Create_OverlappingButCancelled_Succeeds()
    {
        using var scope = NewScope();
        var patientId = await NewPatientAsync();
        var doctorId = (await DoctorIdsAsync()).First();
        var first = await Appointments.CreateAsync(Data(patientId, doctorId, At(10), At(10, 30)), Ct);
        await Appointments.UpdateStatusAsync(first, ClinicId, AppointmentStatusIds.Cancelled, UserId, Ct);

        var second = await Appointments.CreateAsync(Data(patientId, doctorId, At(10), At(10, 30)), Ct);

        Assert.NotEqual(Guid.Empty, second);
    }

    // ── Program de lucru ─────────────────────────────────────────────────────

    /// <summary>Clinică 08–16 și doctor 09–12 în ziua de test (în tranzacția curentă).</summary>
    private async Task ArrangeScheduleAsync(Guid doctorId)
    {
        await ExecAsync("""
            IF EXISTS (SELECT 1 FROM dbo.ClinicSchedule WHERE ClinicId = @ClinicId AND DayOfWeek = @Dow)
                UPDATE dbo.ClinicSchedule SET IsOpen = 1, OpenTime = '08:00', CloseTime = '16:00'
                 WHERE ClinicId = @ClinicId AND DayOfWeek = @Dow;
            ELSE
                INSERT INTO dbo.ClinicSchedule (ClinicId, DayOfWeek, IsOpen, OpenTime, CloseTime, CreatedBy)
                VALUES (@ClinicId, @Dow, 1, '08:00', '16:00', @UserId);

            DELETE FROM dbo.DoctorSchedule WHERE DoctorId = @DoctorId;
            INSERT INTO dbo.DoctorSchedule (ClinicId, DoctorId, DayOfWeek, StartTime, EndTime, CreatedBy)
            VALUES (@ClinicId, @DoctorId, @Dow, '09:00', '12:00', @UserId);
            """, new { ClinicId, DoctorId = doctorId, Dow = TestDayOfWeek, UserId });
    }

    [Fact]
    public async Task Create_OutsideClinicSchedule_Throws50016()
    {
        using var scope = NewScope();
        var patientId = await NewPatientAsync();
        var doctorId = (await DoctorIdsAsync()).First();
        await ArrangeScheduleAsync(doctorId);

        var ex = await Assert.ThrowsAsync<SqlException>(() =>
            Appointments.CreateAsync(Data(patientId, doctorId, At(7), At(7, 30), enforceSchedule: true), Ct));

        Assert.Equal(SqlErrorCodes.AppointmentOutsideSchedule, ex.Number);
        Assert.Contains("clinicii", ex.Message);
    }

    [Fact]
    public async Task Create_OutsideDoctorSchedule_Throws50016()
    {
        using var scope = NewScope();
        var patientId = await NewPatientAsync();
        var doctorId = (await DoctorIdsAsync()).First();
        await ArrangeScheduleAsync(doctorId);

        var ex = await Assert.ThrowsAsync<SqlException>(() =>
            Appointments.CreateAsync(Data(patientId, doctorId, At(13), At(13, 30), enforceSchedule: true), Ct));

        Assert.Equal(SqlErrorCodes.AppointmentOutsideSchedule, ex.Number);
        Assert.Contains("doctorului", ex.Message);
    }

    [Fact]
    public async Task Create_InsideSchedule_And_OverrideOutside_Succeed()
    {
        using var scope = NewScope();
        var patientId = await NewPatientAsync();
        var doctorId = (await DoctorIdsAsync()).First();
        await ArrangeScheduleAsync(doctorId);

        var inside = await Appointments.CreateAsync(Data(patientId, doctorId, At(9, 30), At(10), enforceSchedule: true), Ct);
        var overridden = await Appointments.CreateAsync(Data(patientId, doctorId, At(7), At(7, 30), enforceSchedule: false), Ct);

        Assert.NotEqual(Guid.Empty, inside);
        Assert.NotEqual(Guid.Empty, overridden);
    }

    // ── Status: tranziții, audit, reactivare ─────────────────────────────────

    [Fact]
    public async Task UpdateStatus_WritesAuditLog()
    {
        using var scope = NewScope();
        var patientId = await NewPatientAsync();
        var doctorId = (await DoctorIdsAsync()).First();
        var id = await Appointments.CreateAsync(Data(patientId, doctorId, At(10), At(10, 30)), Ct);

        await Appointments.UpdateStatusAsync(id, ClinicId, AppointmentStatusIds.Confirmed, UserId, Ct);

        var auditRows = await ScalarAsync<int>(
            "SELECT COUNT(*) FROM dbo.AuditLogs WHERE EntityId = @Id AND Action = N'UpdateStatus'", new { Id = id });
        Assert.Equal(1, auditRows);
    }

    [Fact]
    public async Task UpdateStatus_FinalizatToProgramat_Throws50017()
    {
        using var scope = NewScope();
        var patientId = await NewPatientAsync();
        var doctorId = (await DoctorIdsAsync()).First();
        var id = await Appointments.CreateAsync(Data(patientId, doctorId, At(10), At(10, 30)), Ct);
        await Appointments.UpdateStatusAsync(id, ClinicId, AppointmentStatusIds.Completed, UserId, Ct);

        var number = await SqlErrorOf(() =>
            Appointments.UpdateStatusAsync(id, ClinicId, AppointmentStatusIds.Scheduled, UserId, Ct));

        Assert.Equal(SqlErrorCodes.AppointmentInvalidTransition, number);
    }

    [Fact]
    public async Task UpdateStatus_CancelledToScheduled_WhenSlotTaken_Throws50010()
    {
        using var scope = NewScope();
        var patientId = await NewPatientAsync();
        var doctorId = (await DoctorIdsAsync()).First();
        var cancelled = await Appointments.CreateAsync(Data(patientId, doctorId, At(10), At(10, 30)), Ct);
        await Appointments.UpdateStatusAsync(cancelled, ClinicId, AppointmentStatusIds.Cancelled, UserId, Ct);
        await Appointments.CreateAsync(Data(patientId, doctorId, At(10), At(10, 30)), Ct);

        var number = await SqlErrorOf(() =>
            Appointments.UpdateStatusAsync(cancelled, ClinicId, AppointmentStatusIds.Scheduled, UserId, Ct));

        Assert.Equal(SqlErrorCodes.AppointmentConflict, number);
    }

    // ── Concurență optimistă + integritate ───────────────────────────────────

    [Fact]
    public async Task Update_StaleRowVersion_Throws50019()
    {
        using var scope = NewScope();
        var patientId = await NewPatientAsync();
        var doctorId = (await DoctorIdsAsync()).First();
        var id = await Appointments.CreateAsync(Data(patientId, doctorId, At(10), At(10, 30)), Ct);
        var rowVersion = (await Appointments.GetByIdAsync(id, ClinicId, Ct))!.RowVersion;

        await Appointments.UpdateAsync(id, rowVersion, Data(patientId, doctorId, At(10), At(10, 30), notes: "prima editare"), Ct);

        var number = await SqlErrorOf(() =>
            Appointments.UpdateAsync(id, rowVersion, Data(patientId, doctorId, At(10), At(10, 30), notes: "a doua editare"), Ct));

        Assert.Equal(SqlErrorCodes.AppointmentConcurrency, number);
    }

    [Fact]
    public async Task Delete_WithActiveConsultation_Throws50015()
    {
        using var scope = NewScope();
        var patientId = await NewPatientAsync();
        var doctorId = (await DoctorIdsAsync()).First();
        var id = await Appointments.CreateAsync(Data(patientId, doctorId, At(10), At(10, 30)), Ct);
        await Fixture.GetRepository<IConsultationRepository>().CreateAsync(
            new ConsultationCreateData(
                ClinicId, patientId, doctorId, id, TestDay,
                null, null, null, null, null, null, null,
                false, false, false, null, false, null, false, false, null, null),
            UserId, Ct);

        var number = await SqlErrorOf(() => Appointments.DeleteAsync(id, ClinicId, UserId, Ct));

        Assert.Equal(SqlErrorCodes.AppointmentHasConsultation, number);
    }

    // ── Listare: statistici, căutare, paginare stabilă, interval scheduler ───

    [Fact]
    public async Task GetPaged_StatsRespectDoctorFilter_ButIgnoreStatusFilter()
    {
        using var scope = NewScope();
        var patientId = await NewPatientAsync();
        var doctors = await DoctorIdsAsync();
        var doctorId = doctors[0];
        await Appointments.CreateAsync(Data(patientId, doctorId, At(9), At(9, 30)), Ct);
        await Appointments.CreateAsync(Data(patientId, doctorId, At(10), At(10, 30)), Ct);
        await Appointments.CreateAsync(Data(patientId, doctorId, At(11), At(11, 30), AppointmentStatusIds.Cancelled), Ct);
        if (doctors.Count > 1)
            await Appointments.CreateAsync(Data(patientId, doctors[1], At(9), At(9, 30)), Ct);

        var result = await Appointments.GetPagedAsync(
            ClinicId, null, doctorId, AppointmentStatusIds.Cancelled, TestDay, TestDay,
            1, 20, "StartTime", "asc", Ct);

        Assert.Equal(1, result.Paged.TotalCount);
        Assert.Equal(3, result.Stats.TotalAppointments);
        Assert.Equal(2, result.Stats.ScheduledCount);
        Assert.Equal(1, result.Stats.CancelledCount);
    }

    [Fact]
    public async Task GetPaged_SearchWithPercentLiteral_MatchesLiterally()
    {
        using var scope = NewScope();
        var patientId = await NewPatientAsync();
        var doctorId = (await DoctorIdsAsync()).First();
        await Appointments.CreateAsync(Data(patientId, doctorId, At(9), At(9, 30), notes: "Reducere 100% aplicata"), Ct);
        await Appointments.CreateAsync(Data(patientId, doctorId, At(10), At(10, 30), notes: "Reducere 1000 lei"), Ct);

        var result = await Appointments.GetPagedAsync(
            ClinicId, "100%", doctorId, null, TestDay, TestDay, 1, 20, "StartTime", "asc", Ct);

        var item = Assert.Single(result.Paged.Items);
        Assert.Equal("Reducere 100% aplicata", item.Notes);
    }

    [Fact]
    public async Task GetPaged_TiedStartTimes_PagesWithoutDuplicates()
    {
        using var scope = NewScope();
        var patientId = await NewPatientAsync();
        var doctorId = (await DoctorIdsAsync()).First();
        // ANULAT nu ocupă slotul → se pot crea mai multe la aceeași oră
        for (var i = 0; i < 5; i++)
            await Appointments.CreateAsync(Data(patientId, doctorId, At(10), At(10, 30), AppointmentStatusIds.Cancelled), Ct);

        var seen = new List<Guid>();
        for (var page = 1; page <= 3; page++)
        {
            var result = await Appointments.GetPagedAsync(
                ClinicId, null, doctorId, null, TestDay, TestDay, page, 2, "StartTime", "asc", Ct);
            seen.AddRange(result.Paged.Items.Select(i => i.Id));
        }

        Assert.Equal(5, seen.Count);
        Assert.Equal(5, seen.Distinct().Count());
    }

    [Fact]
    public async Task GetByDoctor_AppointmentSpanningRangeStart_IsIncluded()
    {
        using var scope = NewScope();
        var patientId = await NewPatientAsync();
        var doctorId = (await DoctorIdsAsync()).First();
        var nextDay = TestDay.AddDays(1);
        var id = await Appointments.CreateAsync(Data(patientId, doctorId, At(23, 30), At(0, 30, nextDay)), Ct);

        var result = await Appointments.GetForSchedulerAsync(ClinicId, nextDay, nextDay, doctorId, Ct);

        Assert.Contains(result, a => a.Id == id && a.BlocksSlot);
    }

    // ── Concurență reală: două conexiuni, același slot ───────────────────────

    [Fact]
    public async Task Create_ConcurrentSameSlot_OnlyOneSucceeds()
    {
        var day = TestDay.AddDays(7);
        var patientId = await ScalarAsync<Guid>(
            "SELECT TOP 1 Id FROM dbo.Patients WHERE ClinicId = @ClinicId AND IsDeleted = 0", new { ClinicId });
        var doctorId = (await DoctorIdsAsync()).First();
        Assert.NotEqual(Guid.Empty, patientId);

        var created = new System.Collections.Concurrent.ConcurrentBag<Guid>();
        try
        {
            var tasks = Enumerable.Range(0, 2).Select(_ => Task.Run(async () =>
            {
                try
                {
                    created.Add(await Appointments.CreateAsync(
                        Data(patientId, doctorId, At(10, 0, day), At(10, 30, day)), Ct));
                    return (int?)null;
                }
                catch (SqlException ex) { return ex.Number; }
            })).ToArray();

            var results = await Task.WhenAll(tasks);

            Assert.Single(results, r => r is null);
            Assert.Single(results, r => r == SqlErrorCodes.AppointmentConflict);
        }
        finally
        {
            // Date de test comise (fără tranzacție ambientală) → ștergere explicită
            var ids = created.ToArray();
            if (ids.Length > 0)
            {
                await ExecAsync("""
                    DELETE FROM dbo.AuditLogs    WHERE EntityId IN @Ids;
                    DELETE FROM dbo.Appointments WHERE Id       IN @Ids;
                    """, new { Ids = ids });
            }
        }
    }
}
