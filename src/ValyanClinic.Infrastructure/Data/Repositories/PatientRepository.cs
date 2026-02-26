using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Patients.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

/// <summary>Repository Dapper pentru pacienți (exclusiv prin Stored Procedures).</summary>
public sealed class PatientRepository(DapperContext context) : IPatientRepository
{
    public async Task<PagedResult<PatientListDto>> GetPagedAsync(
        Guid clinicId, string? search, Guid? genderId, Guid? doctorId,
        bool? hasAllergies, bool? isActive,
        int page, int pageSize, string sortBy, string sortDir,
        CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                PatientProcedures.GetPaged,
                new
                {
                    ClinicId = clinicId,
                    Search = search,
                    GenderId = genderId,
                    DoctorId = doctorId,
                    HasAllergies = hasAllergies,
                    IsActive = isActive,
                    Page = page,
                    PageSize = pageSize,
                    SortBy = sortBy,
                    SortDir = sortDir
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var items = (await multi.ReadAsync<PatientListDto>()).ToList();
        var totalCount = await multi.ReadSingleAsync<int>();

        return new PagedResult<PatientListDto>(items, totalCount, page, pageSize);
    }

    public async Task<PatientStatsDto> GetStatsAsync(Guid clinicId, CancellationToken ct)
    {
        // Statisticile vin în result set 3 de la GetPaged — apelăm cu parametri minimali
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                PatientProcedures.GetPaged,
                new
                {
                    ClinicId = clinicId,
                    Page = 1,
                    PageSize = 1
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        // Trecem peste result set 1 (items) și 2 (count)
        await multi.ReadAsync();
        await multi.ReadSingleAsync<int>();

        return await multi.ReadSingleAsync<PatientStatsDto>();
    }

    public async Task<PatientFullResult?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                PatientProcedures.GetById,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        // Result set 1: date pacient
        var patient = await multi.ReadFirstOrDefaultAsync<PatientDetailDto>();
        if (patient is null) return null;

        // Result set 2: alergii
        var allergies = (await multi.ReadAsync<PatientAllergyDto>()).ToList().AsReadOnly();

        // Result set 3: doctori
        var doctors = (await multi.ReadAsync<PatientDoctorDto>()).ToList().AsReadOnly();

        // Result set 4: contacte urgență
        var contacts = (await multi.ReadAsync<PatientEmergencyContactDto>()).ToList().AsReadOnly();

        return new PatientFullResult
        {
            Patient = patient,
            Allergies = allergies,
            Doctors = doctors,
            EmergencyContacts = contacts
        };
    }

    public async Task<Guid> CreateAsync(
        Guid clinicId, string firstName, string lastName,
        string? cnp, DateTime? birthDate, Guid? genderId, Guid? bloodTypeId,
        string? phoneNumber, string? secondaryPhone, string? email, string? address,
        string? city, string? county, string? postalCode,
        string? insuranceNumber, DateTime? insuranceExpiry, bool isInsured,
        string? chronicDiseases, string? familyDoctorName, string? notes,
        Guid createdBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                PatientProcedures.Create,
                new
                {
                    ClinicId = clinicId,
                    FirstName = firstName,
                    LastName = lastName,
                    Cnp = cnp,
                    BirthDate = birthDate,
                    GenderId = genderId,
                    BloodTypeId = bloodTypeId,
                    PhoneNumber = phoneNumber,
                    SecondaryPhone = secondaryPhone,
                    Email = email,
                    Address = address,
                    City = city,
                    County = county,
                    PostalCode = postalCode,
                    InsuranceNumber = insuranceNumber,
                    InsuranceExpiry = insuranceExpiry,
                    IsInsured = isInsured,
                    ChronicDiseases = chronicDiseases,
                    FamilyDoctorName = familyDoctorName,
                    Notes = notes,
                    CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateAsync(
        Guid id, Guid clinicId, string firstName, string lastName,
        string? cnp, DateTime? birthDate, Guid? genderId, Guid? bloodTypeId,
        string? phoneNumber, string? secondaryPhone, string? email, string? address,
        string? city, string? county, string? postalCode,
        string? insuranceNumber, DateTime? insuranceExpiry, bool isInsured,
        string? chronicDiseases, string? familyDoctorName, string? notes,
        bool isActive, Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                PatientProcedures.Update,
                new
                {
                    Id = id,
                    ClinicId = clinicId,
                    FirstName = firstName,
                    LastName = lastName,
                    Cnp = cnp,
                    BirthDate = birthDate,
                    GenderId = genderId,
                    BloodTypeId = bloodTypeId,
                    PhoneNumber = phoneNumber,
                    SecondaryPhone = secondaryPhone,
                    Email = email,
                    Address = address,
                    City = city,
                    County = county,
                    PostalCode = postalCode,
                    InsuranceNumber = insuranceNumber,
                    InsuranceExpiry = insuranceExpiry,
                    IsInsured = isInsured,
                    ChronicDiseases = chronicDiseases,
                    FamilyDoctorName = familyDoctorName,
                    Notes = notes,
                    IsActive = isActive,
                    UpdatedBy = updatedBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task DeleteAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                PatientProcedures.Delete,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task SyncAllergiesAsync(
        Guid patientId, Guid createdBy,
        IEnumerable<SyncAllergyItem> allergies, CancellationToken ct)
    {
        var table = new DataTable();
        table.Columns.Add("AllergyTypeId", typeof(Guid));
        table.Columns.Add("AllergySeverityId", typeof(Guid));
        table.Columns.Add("AllergenName", typeof(string));
        table.Columns.Add("Reaction", typeof(string));
        table.Columns.Add("OnsetDate", typeof(DateTime));
        table.Columns.Add("Notes", typeof(string));

        foreach (var a in allergies)
        {
            table.Rows.Add(
                a.AllergyTypeId,
                a.AllergySeverityId,
                a.AllergenName,
                (object?)a.Reaction ?? DBNull.Value,
                (object?)a.OnsetDate ?? DBNull.Value,
                (object?)a.Notes ?? DBNull.Value);
        }

        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                PatientProcedures.SyncAllergies,
                new
                {
                    PatientId = patientId,
                    CreatedBy = createdBy,
                    Allergies = table.AsTableValuedParameter("dbo.PatientAllergyTableType")
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task SyncDoctorsAsync(
        Guid patientId, Guid createdBy,
        IEnumerable<SyncDoctorItem> doctors, CancellationToken ct)
    {
        var table = new DataTable();
        table.Columns.Add("DoctorId", typeof(Guid));
        table.Columns.Add("IsPrimary", typeof(bool));
        table.Columns.Add("Notes", typeof(string));

        foreach (var d in doctors)
        {
            table.Rows.Add(
                d.DoctorId,
                d.IsPrimary,
                (object?)d.Notes ?? DBNull.Value);
        }

        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                PatientProcedures.SyncDoctors,
                new
                {
                    PatientId = patientId,
                    CreatedBy = createdBy,
                    Doctors = table.AsTableValuedParameter("dbo.PatientDoctorTableType")
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task SyncEmergencyContactsAsync(
        Guid patientId, Guid createdBy,
        IEnumerable<SyncEmergencyContactItem> contacts, CancellationToken ct)
    {
        var table = new DataTable();
        table.Columns.Add("FullName", typeof(string));
        table.Columns.Add("Relationship", typeof(string));
        table.Columns.Add("PhoneNumber", typeof(string));
        table.Columns.Add("IsDefault", typeof(bool));
        table.Columns.Add("Notes", typeof(string));

        foreach (var c in contacts)
        {
            table.Rows.Add(
                c.FullName,
                c.Relationship,
                c.PhoneNumber,
                c.IsDefault,
                (object?)c.Notes ?? DBNull.Value);
        }

        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                PatientProcedures.SyncEmergencyContacts,
                new
                {
                    PatientId = patientId,
                    CreatedBy = createdBy,
                    Contacts = table.AsTableValuedParameter("dbo.PatientEmergencyContactTableType")
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
