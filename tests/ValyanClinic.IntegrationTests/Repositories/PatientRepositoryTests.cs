using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.IntegrationTests.Fixtures;

namespace ValyanClinic.IntegrationTests.Repositories;

/// <summary>
/// Teste de integrare pentru PatientRepository.
/// Verifică că SP-urile Patient_Create / GetById / GetPaged / Delete funcționează corect
/// end-to-end împotriva bazei de date reale.
/// Fiecare test curăță datele create (soft-delete) — nu afectează datele existente.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class PatientRepositoryTests(IntegrationTestFixture fixture)
    : IntegrationTestBase(fixture)
{
    private IPatientRepository Repo => Fixture.GetRepository<IPatientRepository>();

    // ─────────────────────────────────────────────────────────────────────────
    // Patient_Create → returnează Guid valid
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_WithMinimalData_ReturnsNonEmptyGuid()
    {
        var cnp      = NewTestCnp();
        Guid created = Guid.Empty;

        try
        {
            created = await Repo.CreateAsync(
                clinicId:          Fixture.TestClinicId,
                firstName:         TestPrefix + "Ion",
                lastName:          TestPrefix + "Popescu",
                cnp:               cnp,
                birthDate:         new DateTime(1985, 6, 15),
                genderId:          null,
                bloodTypeId:       null,
                phoneNumber:       null,
                secondaryPhone:    null,
                email:             null,
                address:           null,
                city:              null,
                county:            null,
                postalCode:        null,
                insuranceNumber:   null,
                insuranceExpiry:   null,
                isInsured:         false,
                chronicDiseases:   null,
                familyDoctorName:  null,
                notes:             "Test integrare",
                createdBy:         Fixture.TestUserId,
                ct:                CancellationToken.None);

            Assert.NotEqual(Guid.Empty, created);
        }
        finally
        {
            if (created != Guid.Empty)
                await Repo.DeleteAsync(created, Fixture.TestClinicId, Fixture.TestUserId, CancellationToken.None);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Patient_Create → Patient_GetById (4 result sets)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_ThenGetById_ReturnsCorrectData()
    {
        var cnp  = NewTestCnp();
        var id   = Guid.Empty;

        try
        {
            id = await Repo.CreateAsync(
                clinicId:          Fixture.TestClinicId,
                firstName:         TestPrefix + "Maria",
                lastName:          TestPrefix + "Ionescu",
                cnp:               cnp,
                birthDate:         new DateTime(1990, 3, 20),
                genderId:          null,
                bloodTypeId:       null,
                phoneNumber:       "0720000001",
                secondaryPhone:    null,
                email:             "it_test@valyan.test",
                address:           "Str. Testului nr. 1",
                city:              "București",
                county:            "Ilfov",
                postalCode:        "010101",
                insuranceNumber:   null,
                insuranceExpiry:   null,
                isInsured:         true,
                chronicDiseases:   "Nimic",
                familyDoctorName:  "Dr. Test",
                notes:             null,
                createdBy:         Fixture.TestUserId,
                ct:                CancellationToken.None);

            var result = await Repo.GetByIdAsync(id, Fixture.TestClinicId, CancellationToken.None);

            Assert.NotNull(result);
            Assert.Equal(id, result.Patient.Id);
            Assert.Equal(TestPrefix + "Maria",   result.Patient.FirstName);
            Assert.Equal(TestPrefix + "Ionescu", result.Patient.LastName);
            Assert.Equal(cnp, result.Patient.Cnp);
            Assert.Equal("0720000001", result.Patient.PhoneNumber);
            Assert.Equal("it_test@valyan.test", result.Patient.Email);
            Assert.True(result.Patient.IsActive);

            // Colecțiile copil (fără date sincronizate) trebuie să fie goale, nu null
            Assert.NotNull(result.Allergies);
            Assert.NotNull(result.Doctors);
            Assert.NotNull(result.EmergencyContacts);
        }
        finally
        {
            if (id != Guid.Empty)
                await Repo.DeleteAsync(id, Fixture.TestClinicId, Fixture.TestUserId, CancellationToken.None);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Patient_GetById — pacient inexistent returnează null (fără excepție)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_NonExistentId_ReturnsNull()
    {
        var result = await Repo.GetByIdAsync(Guid.NewGuid(), Fixture.TestClinicId, CancellationToken.None);

        Assert.Null(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Patient_GetById — alt ClinicId → n-ar trebui să returneze pacientul
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_WrongClinicId_ReturnsNull()
    {
        var cnp = NewTestCnp();
        var id  = Guid.Empty;

        try
        {
            id = await Repo.CreateAsync(
                clinicId:          Fixture.TestClinicId,
                firstName:         TestPrefix + "Test",
                lastName:          TestPrefix + "Clinic",
                cnp:               cnp,
                birthDate:         null,
                genderId:          null,
                bloodTypeId:       null,
                phoneNumber:       null,
                secondaryPhone:    null,
                email:             null,
                address:           null,
                city:              null,
                county:            null,
                postalCode:        null,
                insuranceNumber:   null,
                insuranceExpiry:   null,
                isInsured:         false,
                chronicDiseases:   null,
                familyDoctorName:  null,
                notes:             null,
                createdBy:         Fixture.TestUserId,
                ct:                CancellationToken.None);

            var wrongClinicId = Guid.NewGuid();
            var result = await Repo.GetByIdAsync(id, wrongClinicId, CancellationToken.None);

            Assert.Null(result);
        }
        finally
        {
            if (id != Guid.Empty)
                await Repo.DeleteAsync(id, Fixture.TestClinicId, Fixture.TestUserId, CancellationToken.None);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Patient_Create → CNP duplicat → SqlException cu codul 50001
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_DuplicateCnp_ThrowsSqlException50001()
    {
        var cnp  = NewTestCnp();
        var id1  = Guid.Empty;

        try
        {
            id1 = await Repo.CreateAsync(
                clinicId:          Fixture.TestClinicId,
                firstName:         TestPrefix + "Dup",
                lastName:          TestPrefix + "CNP1",
                cnp:               cnp,
                birthDate:         null,
                genderId:          null, bloodTypeId: null, phoneNumber: null,
                secondaryPhone:    null, email: null, address: null, city: null,
                county:            null, postalCode: null, insuranceNumber: null,
                insuranceExpiry:   null, isInsured: false, chronicDiseases: null,
                familyDoctorName:  null, notes:  null,
                createdBy:         Fixture.TestUserId,
                ct:                CancellationToken.None);

            // Al doilea create cu același CNP trebuie să arunce eroare SP 50001
            var ex = await Assert.ThrowsAsync<Microsoft.Data.SqlClient.SqlException>(() =>
                Repo.CreateAsync(
                    clinicId:          Fixture.TestClinicId,
                    firstName:         TestPrefix + "Dup",
                    lastName:          TestPrefix + "CNP2",
                    cnp:               cnp,
                    birthDate:         null,
                    genderId:          null, bloodTypeId: null, phoneNumber: null,
                    secondaryPhone:    null, email: null, address: null, city: null,
                    county:            null, postalCode: null, insuranceNumber: null,
                    insuranceExpiry:   null, isInsured: false, chronicDiseases: null,
                    familyDoctorName:  null, notes: null,
                    createdBy:         Fixture.TestUserId,
                    ct:                CancellationToken.None));

            Assert.Equal(50001, ex.Number);
        }
        finally
        {
            if (id1 != Guid.Empty)
                await Repo.DeleteAsync(id1, Fixture.TestClinicId, Fixture.TestUserId, CancellationToken.None);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Patient_GetPaged — returnează structura corectă (3 result sets)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetPaged_ReturnsCorrectStructure()
    {
        var result = await Repo.GetPagedAsync(
            clinicId:    Fixture.TestClinicId,
            search:      null,
            genderId:    null,
            bloodTypeId: null,
            doctorId:    null,
            hasAllergies: null,
            isActive:    null,
            page:        1,
            pageSize:    10,
            sortBy:      "LastName",
            sortDir:     "asc",
            ct:          CancellationToken.None);

        // RS1 + RS2: obiectul paginat
        Assert.NotNull(result.Paged);
        Assert.NotNull(result.Paged.Items);
        Assert.True(result.Paged.TotalCount >= 0);
        Assert.True(result.Paged.Page == 1);
        Assert.True(result.Paged.PageSize == 10);

        // RS3: statistici clinică
        Assert.NotNull(result.Stats);
    }

    [Fact]
    public async Task GetPaged_Page1_CountMatchesTotalRows()
    {
        var page1 = await Repo.GetPagedAsync(
            clinicId: Fixture.TestClinicId, search: null, genderId: null,
            bloodTypeId: null, doctorId: null, hasAllergies: null, isActive: null,
            page: 1, pageSize: 5, sortBy: "LastName", sortDir: "asc",
            ct: CancellationToken.None);

        // Items.Count ≤ PageSize
        Assert.True(page1.Paged.Items.Count <= 5);
        // TotalCount ≥ Items.Count
        Assert.True(page1.Paged.TotalCount >= page1.Paged.Items.Count);
    }

    [Fact]
    public async Task GetPaged_SearchFilter_ReturnsSubset()
    {
        var cnp = NewTestCnp();
        var id  = Guid.Empty;

        try
        {
            id = await Repo.CreateAsync(
                clinicId:          Fixture.TestClinicId,
                firstName:         TestPrefix + "Unic",
                lastName:          TestPrefix + "Filtru99",
                cnp:               cnp,
                birthDate:         null,
                genderId:          null, bloodTypeId: null, phoneNumber: null,
                secondaryPhone:    null, email: null, address: null, city: null,
                county:            null, postalCode: null, insuranceNumber: null,
                insuranceExpiry:   null, isInsured: false, chronicDiseases: null,
                familyDoctorName:  null, notes: null,
                createdBy:         Fixture.TestUserId,
                ct:                CancellationToken.None);

            var filtered = await Repo.GetPagedAsync(
                clinicId:    Fixture.TestClinicId,
                search:      "Filtru99",
                genderId:    null, bloodTypeId: null, doctorId: null,
                hasAllergies: null, isActive: null,
                page: 1, pageSize: 50,
                sortBy: "LastName", sortDir: "asc",
                ct: CancellationToken.None);

            Assert.True(filtered.Paged.TotalCount >= 1);
            Assert.Contains(filtered.Paged.Items, p => p.Id == id);
        }
        finally
        {
            if (id != Guid.Empty)
                await Repo.DeleteAsync(id, Fixture.TestClinicId, Fixture.TestUserId, CancellationToken.None);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Patient_Delete (soft) → GetById returnează null
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_ExistingPatient_GetByIdReturnsNull()
    {
        var cnp = NewTestCnp();
        var id  = await Repo.CreateAsync(
            clinicId:          Fixture.TestClinicId,
            firstName:         TestPrefix + "Del",
            lastName:          TestPrefix + "Test",
            cnp:               cnp,
            birthDate:         null,
            genderId:          null, bloodTypeId: null, phoneNumber: null,
            secondaryPhone:    null, email: null, address: null, city: null,
            county:            null, postalCode: null, insuranceNumber: null,
            insuranceExpiry:   null, isInsured: false, chronicDiseases: null,
            familyDoctorName:  null, notes: null,
            createdBy:         Fixture.TestUserId,
            ct:                CancellationToken.None);

        await Repo.DeleteAsync(id, Fixture.TestClinicId, Fixture.TestUserId, CancellationToken.None);

        var result = await Repo.GetByIdAsync(id, Fixture.TestClinicId, CancellationToken.None);
        Assert.Null(result);
    }
}
