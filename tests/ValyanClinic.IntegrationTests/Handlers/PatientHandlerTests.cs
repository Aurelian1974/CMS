using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Patients.Commands.CreatePatient;
using ValyanClinic.Application.Features.Patients.Queries.GetPatients;
using ValyanClinic.IntegrationTests.Fixtures;

namespace ValyanClinic.IntegrationTests.Handlers;

/// <summary>
/// Teste end-to-end pentru pipeline-ul pacienților:
/// Command/Query → Handler → PatientRepository → SP → DB.
/// Cleanup: fiecare test write șterge datele create în DisposeAsync.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class PatientHandlerTests(IntegrationTestFixture fixture)
    : IntegrationTestBase(fixture), IAsyncLifetime
{
    private ISender            Sender     => Fixture.CreateSender();
    private IPatientRepository PatientRepo => Fixture.GetRepository<IPatientRepository>();

    private readonly List<Guid> _createdIds = [];

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        foreach (var id in _createdIds)
        {
            try { await PatientRepo.DeleteAsync(id, Fixture.TestClinicId, Fixture.TestUserId, CancellationToken.None); }
            catch { /* ignoră erorile de cleanup */ }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GetPatientsQuery — MediatR pipeline + SP Patient_GetPaged
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetPatients_DefaultQuery_ReturnsSuccess()
    {
        var result = await Sender.Send(new GetPatientsQuery(), CancellationToken.None);

        Assert.True(result.IsSuccess, $"Handler eșuat: {result.Error}");
        Assert.NotNull(result.Value);
        Assert.NotNull(result.Value.PagedResult);
        Assert.NotNull(result.Value.Stats);
    }

    [Fact]
    public async Task GetPatients_PageStructureIsCorrect()
    {
        var query  = new GetPatientsQuery(Page: 1, PageSize: 5);
        var result = await Sender.Send(query, CancellationToken.None);

        Assert.True(result.IsSuccess);
        var paged = result.Value!.PagedResult;
        Assert.Equal(1,  paged.Page);
        Assert.Equal(5,  paged.PageSize);
        Assert.True(paged.Items.Count <= 5);
        Assert.True(paged.TotalCount >= 0);
        Assert.True(paged.TotalPages >= 0);
    }

    [Fact]
    public async Task GetPatients_SortByFirstName_DoesNotThrow()
    {
        var result = await Sender.Send(
            new GetPatientsQuery(SortBy: "FirstName", SortDir: "desc"),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CreatePatientCommand → GetPatientsQuery — verificare end-to-end
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task CreatePatient_ThenQueryfindsIt_EndToEnd()
    {
        var uniqueSuffix = Guid.NewGuid().ToString("N")[..8].ToUpper();
        var lastName     = $"{TestPrefix}E2E_{uniqueSuffix}";
        var cnp          = NewTestCnp();

        var createResult = await Sender.Send(new CreatePatientCommand(
            FirstName:       TestPrefix + "Test",
            LastName:        lastName,
            Cnp:             cnp,
            BirthDate:       new DateTime(1988, 1, 1),
            GenderId:        null,
            BloodTypeId:     null,
            PhoneNumber:     null,
            SecondaryPhone:  null,
            Email:           null,
            Address:         null,
            City:            null,
            County:          null,
            PostalCode:      null,
            InsuranceNumber: null,
            InsuranceExpiry: null,
            IsInsured:       false,
            ChronicDiseases: null,
            FamilyDoctorName: null,
            Notes:           "Integration test E2E",
            Allergies:       null,
            Doctors:         null,
            EmergencyContacts: null
        ), CancellationToken.None);

        Assert.True(createResult.IsSuccess, $"Create a eșuat: {createResult.Error}");
        var patientId = createResult.Value;
        _createdIds.Add(patientId);

        // Acum query — pacientul trebuie să fie găsit cu search pe Last Name
        var listResult = await Sender.Send(
            new GetPatientsQuery(Search: lastName, PageSize: 10),
            CancellationToken.None);

        Assert.True(listResult.IsSuccess);
        Assert.Contains(listResult.Value!.PagedResult.Items, p => p.Id == patientId);
    }

    [Fact]
    public async Task CreatePatient_DuplicateCnp_ReturnsConflict()
    {
        var cnp = NewTestCnp();

        var first = await Sender.Send(new CreatePatientCommand(
            FirstName: TestPrefix + "Dup1", LastName: TestPrefix + "Dup",
            Cnp: cnp, BirthDate: null, GenderId: null, BloodTypeId: null,
            PhoneNumber: null, SecondaryPhone: null, Email: null,
            Address: null, City: null, County: null, PostalCode: null,
            InsuranceNumber: null, InsuranceExpiry: null, IsInsured: false,
            ChronicDiseases: null, FamilyDoctorName: null, Notes: null,
            Allergies: null, Doctors: null, EmergencyContacts: null
        ), CancellationToken.None);

        Assert.True(first.IsSuccess);
        _createdIds.Add(first.Value);

        // Al doilea pacient cu același CNP → Conflict (SP 50001)
        var second = await Sender.Send(new CreatePatientCommand(
            FirstName: TestPrefix + "Dup2", LastName: TestPrefix + "Dup",
            Cnp: cnp, BirthDate: null, GenderId: null, BloodTypeId: null,
            PhoneNumber: null, SecondaryPhone: null, Email: null,
            Address: null, City: null, County: null, PostalCode: null,
            InsuranceNumber: null, InsuranceExpiry: null, IsInsured: false,
            ChronicDiseases: null, FamilyDoctorName: null, Notes: null,
            Allergies: null, Doctors: null, EmergencyContacts: null
        ), CancellationToken.None);

        Assert.False(second.IsSuccess);
        Assert.Equal(409, second.StatusCode); // Conflict
    }

    [Fact]
    public async Task CreatePatient_StatisticsUpdated_AfterCreate()
    {
        // Stats înainte
        var before = await Sender.Send(new GetPatientsQuery(PageSize: 1), CancellationToken.None);
        var countBefore = before.Value!.Stats.TotalPatients;

        var cnp = NewTestCnp();
        var create = await Sender.Send(new CreatePatientCommand(
            FirstName: TestPrefix + "Stat", LastName: TestPrefix + "Test",
            Cnp: cnp, BirthDate: null, GenderId: null, BloodTypeId: null,
            PhoneNumber: null, SecondaryPhone: null, Email: null,
            Address: null, City: null, County: null, PostalCode: null,
            InsuranceNumber: null, InsuranceExpiry: null, IsInsured: false,
            ChronicDiseases: null, FamilyDoctorName: null, Notes: null,
            Allergies: null, Doctors: null, EmergencyContacts: null
        ), CancellationToken.None);

        Assert.True(create.IsSuccess);
        _createdIds.Add(create.Value);

        // Stats după
        var after = await Sender.Send(new GetPatientsQuery(PageSize: 1), CancellationToken.None);
        Assert.True(after.Value!.Stats.TotalPatients >= countBefore + 1);
    }
}
