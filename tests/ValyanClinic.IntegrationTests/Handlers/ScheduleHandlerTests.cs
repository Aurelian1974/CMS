using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Schedule.Commands;
using ValyanClinic.Application.Features.Schedule.Queries;
using ValyanClinic.IntegrationTests.Fixtures;

namespace ValyanClinic.IntegrationTests.Handlers;

/// <summary>
/// Teste de integrare pentru pipeline-ul Schedule:
/// Command/Query → Handler → ScheduleRepository → SP → DB.
/// Cleanup: DeleteDoctorDay + ștergere directă ClinicSchedule din DisposeAsync.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class ScheduleHandlerTests(IntegrationTestFixture fixture)
    : IntegrationTestBase(fixture), IAsyncLifetime
{
    private ISender            Sender   => Fixture.CreateSender();
    private IScheduleRepository Repo    => Fixture.GetRepository<IScheduleRepository>();

    // Doctor real existent în baza de date de test (semat la migrare)
    private static readonly Guid TestDoctorId = Guid.Parse("E2ABF820-0F12-F111-BBB1-20235109A3A2");

    private readonly List<byte>  _createdClinicDays  = [];
    private readonly List<byte>  _createdDoctorDays  = [];

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        // Curăță zilele de medic create în teste
        foreach (var day in _createdDoctorDays)
        {
            try
            {
                await Repo.DeleteDoctorDayAsync(TestDoctorId, day, Fixture.TestClinicId, CancellationToken.None);
            }
            catch { /* ignorat în cleanup */ }
        }

        // Curăță zilele de clinică create în teste (setăm IsOpen=false cu null times)
        foreach (var day in _createdClinicDays)
        {
            try
            {
                await Repo.UpsertClinicDayAsync(
                    Fixture.TestClinicId, day, false, null, null,
                    Fixture.TestUserId, CancellationToken.None);
            }
            catch { /* ignorat în cleanup */ }
        }
    }

    // ── GetClinicScheduleQuery ────────────────────────────────────────────────

    [Fact]
    public async Task GetClinicSchedule_ReturnsSuccess()
    {
        var result = await Sender.Send(new GetClinicScheduleQuery(), CancellationToken.None);

        Assert.True(result.IsSuccess, $"Handler eșuat: {result.Error}");
        Assert.NotNull(result.Value);
    }

    [Fact]
    public async Task GetClinicSchedule_ResultIsEnumerable()
    {
        var result = await Sender.Send(new GetClinicScheduleQuery(), CancellationToken.None);

        Assert.True(result.IsSuccess);
        // Poate fi goală (nicio zi configurată) sau cu date existente
        var list = result.Value!.ToList();
        Assert.True(list.Count >= 0);
    }

    // ── UpsertClinicDay → GetClinicSchedule (round-trip) ─────────────────────

    [Fact]
    public async Task UpsertClinicDay_ThenGet_ReturnsUpdatedDay()
    {
        const byte dayOfWeek = 1; // Luni
        _createdClinicDays.Add(dayOfWeek);

        // Upsert
        var upsertResult = await Sender.Send(
            new UpsertClinicDayCommand(dayOfWeek, true, "08:00", "16:00"),
            CancellationToken.None);
        Assert.True(upsertResult.IsSuccess, $"Upsert eșuat: {upsertResult.Error}");

        // Verify via repository direct
        var schedule = (await Repo.GetClinicScheduleAsync(Fixture.TestClinicId, CancellationToken.None)).ToList();
        var day = schedule.FirstOrDefault(d => d.DayOfWeek == dayOfWeek);

        Assert.NotNull(day);
        Assert.True(day.IsOpen);
        Assert.Equal("08:00", day.OpenTime);
        Assert.Equal("16:00", day.CloseTime);
    }

    [Fact]
    public async Task UpsertClinicDay_Closed_ClearsTime()
    {
        const byte dayOfWeek = 7; // Duminică
        _createdClinicDays.Add(dayOfWeek);

        // Întâi setăm deschis
        await Repo.UpsertClinicDayAsync(
            Fixture.TestClinicId, dayOfWeek, true, "10:00", "14:00",
            Fixture.TestUserId, CancellationToken.None);

        // Apoi setăm închis
        var result = await Sender.Send(
            new UpsertClinicDayCommand(dayOfWeek, false, null, null),
            CancellationToken.None);
        Assert.True(result.IsSuccess);

        var schedule = (await Repo.GetClinicScheduleAsync(Fixture.TestClinicId, CancellationToken.None)).ToList();
        var day = schedule.FirstOrDefault(d => d.DayOfWeek == dayOfWeek);

        Assert.NotNull(day);
        Assert.False(day.IsOpen);
        Assert.Null(day.OpenTime);
        Assert.Null(day.CloseTime);
    }

    [Fact]
    public async Task UpsertClinicDay_UpdateExisting_Overwrites()
    {
        const byte dayOfWeek = 2; // Marți
        _createdClinicDays.Add(dayOfWeek);

        await Repo.UpsertClinicDayAsync(
            Fixture.TestClinicId, dayOfWeek, true, "08:00", "17:00",
            Fixture.TestUserId, CancellationToken.None);

        // Update
        var result = await Sender.Send(
            new UpsertClinicDayCommand(dayOfWeek, true, "09:00", "18:00"),
            CancellationToken.None);
        Assert.True(result.IsSuccess);

        var schedule = (await Repo.GetClinicScheduleAsync(Fixture.TestClinicId, CancellationToken.None)).ToList();
        var day = schedule.FirstOrDefault(d => d.DayOfWeek == dayOfWeek);

        Assert.NotNull(day);
        Assert.Equal("09:00", day.OpenTime);
        Assert.Equal("18:00", day.CloseTime);
    }

    // ── GetDoctorScheduleByClinicQuery ────────────────────────────────────────

    [Fact]
    public async Task GetDoctorScheduleByClinic_ReturnsSuccess()
    {
        var result = await Sender.Send(new GetDoctorScheduleByClinicQuery(), CancellationToken.None);

        Assert.True(result.IsSuccess, $"Handler eșuat: {result.Error}");
        Assert.NotNull(result.Value);
    }

    [Fact]
    public async Task GetDoctorScheduleByClinic_AfterUpsert_ContainsDoctor()
    {
        const byte dayOfWeek = 1;
        _createdDoctorDays.Add(dayOfWeek);

        await Repo.UpsertDoctorDayAsync(
            Fixture.TestClinicId, TestDoctorId, dayOfWeek,
            "08:00", "16:00", Fixture.TestUserId, CancellationToken.None);

        var result = await Sender.Send(new GetDoctorScheduleByClinicQuery(), CancellationToken.None);

        Assert.True(result.IsSuccess);
        var list = result.Value!.ToList();
        var doctorEntry = list.FirstOrDefault(d => d.DoctorId == TestDoctorId && d.DayOfWeek == dayOfWeek);
        Assert.NotNull(doctorEntry);
        Assert.Equal("08:00", doctorEntry.StartTime);
        Assert.Equal("16:00", doctorEntry.EndTime);
    }

    // ── GetDoctorScheduleQuery ────────────────────────────────────────────────

    [Fact]
    public async Task GetDoctorSchedule_ReturnsSuccess()
    {
        var result = await Sender.Send(new GetDoctorScheduleQuery(TestDoctorId), CancellationToken.None);

        Assert.True(result.IsSuccess, $"Handler eșuat: {result.Error}");
        Assert.NotNull(result.Value);
    }

    // ── UpsertDoctorDay → GetDoctorSchedule → DeleteDoctorDay (full round-trip) ─

    [Fact]
    public async Task UpsertDoctorDay_ThenGet_ThenDelete_FullRoundTrip()
    {
        const byte dayOfWeek = 4; // Joi
        // nu adăugăm la _createdDoctorDays — îl ștergem manual în test

        // 1. Upsert
        var upsertResult = await Sender.Send(
            new UpsertDoctorDayCommand(TestDoctorId, dayOfWeek, "09:00", "17:00"),
            CancellationToken.None);
        Assert.True(upsertResult.IsSuccess, $"Upsert eșuat: {upsertResult.Error}");

        // 2. Verify Get
        var getResult = await Sender.Send(new GetDoctorScheduleQuery(TestDoctorId), CancellationToken.None);
        Assert.True(getResult.IsSuccess);
        var added = getResult.Value!.FirstOrDefault(d => d.DayOfWeek == dayOfWeek);
        Assert.NotNull(added);
        Assert.Equal("09:00", added.StartTime);
        Assert.Equal("17:00", added.EndTime);

        // 3. Delete
        var deleteResult = await Sender.Send(
            new DeleteDoctorDayCommand(TestDoctorId, dayOfWeek),
            CancellationToken.None);
        Assert.True(deleteResult.IsSuccess, $"Delete eșuat: {deleteResult.Error}");

        // 4. Verify deleted
        var afterDelete = await Sender.Send(new GetDoctorScheduleQuery(TestDoctorId), CancellationToken.None);
        Assert.True(afterDelete.IsSuccess);
        var stillExists = afterDelete.Value!.Any(d => d.DayOfWeek == dayOfWeek);
        Assert.False(stillExists);
    }

    [Fact]
    public async Task UpsertDoctorDay_UpdateExisting_Overwrites()
    {
        const byte dayOfWeek = 5; // Vineri
        _createdDoctorDays.Add(dayOfWeek);

        await Repo.UpsertDoctorDayAsync(
            Fixture.TestClinicId, TestDoctorId, dayOfWeek,
            "08:00", "14:00", Fixture.TestUserId, CancellationToken.None);

        var result = await Sender.Send(
            new UpsertDoctorDayCommand(TestDoctorId, dayOfWeek, "10:00", "18:00"),
            CancellationToken.None);
        Assert.True(result.IsSuccess);

        var get = await Repo.GetDoctorScheduleByDoctorAsync(TestDoctorId, Fixture.TestClinicId, CancellationToken.None);
        var updated = get.FirstOrDefault(d => d.DayOfWeek == dayOfWeek);

        Assert.NotNull(updated);
        Assert.Equal("10:00", updated.StartTime);
        Assert.Equal("18:00", updated.EndTime);
    }
}
