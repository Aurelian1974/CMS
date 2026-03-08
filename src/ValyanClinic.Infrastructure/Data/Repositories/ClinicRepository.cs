using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Clinics.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

/// <summary>Repository Dapper pentru clinici (exclusiv prin Stored Procedures).</summary>
public sealed class ClinicRepository(DapperContext context) : IClinicRepository
{
    public async Task<ClinicDto?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                ClinicProcedures.GetById,
                new { Id = id },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var clinic = await multi.ReadFirstOrDefaultAsync<ClinicDto>();
        if (clinic is not null)
        {
            clinic.CaenCodes       = (await multi.ReadAsync<ClinicCaenCodeDto>()).ToList();
            clinic.BankAccounts    = (await multi.ReadAsync<ClinicBankAccountDto>()).ToList();
            clinic.Addresses       = (await multi.ReadAsync<ClinicAddressDto>()).ToList();
            clinic.Contacts        = (await multi.ReadAsync<ClinicContactDto>()).ToList();
            clinic.ContactPersons  = (await multi.ReadAsync<ClinicContactPersonDto>()).ToList();
        }

        return clinic;
    }

    public async Task<IEnumerable<ClinicDto>> GetAllAsync(bool? isActive, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryAsync<ClinicDto>(
            new CommandDefinition(
                ClinicProcedures.GetAll,
                new { IsActive = isActive },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<Guid> CreateAsync(
        string name, string fiscalCode, string? tradeRegisterNumber,
        string? legalRepresentative, string? contractCnas,
        string address, string city, string county, string? postalCode,
        string? bankName, string? bankAccount,
        string? email, string? phoneNumber, string? website,
        CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                ClinicProcedures.Create,
                new
                {
                    Name = name,
                    FiscalCode = fiscalCode,
                    TradeRegisterNumber = tradeRegisterNumber,
                    LegalRepresentative = legalRepresentative,
                    ContractCNAS = contractCnas,
                    Address = address,
                    City = city,
                    County = county,
                    PostalCode = postalCode,
                    BankName = bankName,
                    BankAccount = bankAccount,
                    Email = email,
                    PhoneNumber = phoneNumber,
                    Website = website
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateAsync(
        Guid id, string name, string fiscalCode, string? tradeRegisterNumber,
        string? legalRepresentative, string? contractCnas,
        CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                ClinicProcedures.Update,
                new
                {
                    Id = id,
                    Name = name,
                    FiscalCode = fiscalCode,
                    TradeRegisterNumber = tradeRegisterNumber,
                    LegalRepresentative = legalRepresentative,
                    ContractCNAS = contractCnas
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    // ── Conturi bancare ──────────────────────────────────────────────────────

    public async Task<Guid> CreateBankAccountAsync(
        Guid clinicId, string bankName, string iban, string currency,
        bool isMain, string? notes, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                ClinicProcedures.BankAccountCreate,
                new { ClinicId = clinicId, BankName = bankName, Iban = iban, Currency = currency, IsMain = isMain, Notes = notes },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateBankAccountAsync(
        Guid id, Guid clinicId, string bankName, string iban, string currency,
        bool isMain, string? notes, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                ClinicProcedures.BankAccountUpdate,
                new { Id = id, ClinicId = clinicId, BankName = bankName, Iban = iban, Currency = currency, IsMain = isMain, Notes = notes },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task DeleteBankAccountAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                ClinicProcedures.BankAccountDelete,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    // ── Adrese ───────────────────────────────────────────────────────────────

    public async Task<Guid> CreateAddressAsync(
        Guid clinicId, string addressType, string street, string city, string county,
        string? postalCode, string country, bool isMain, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                ClinicProcedures.AddressCreate,
                new { ClinicId = clinicId, AddressType = addressType, Street = street, City = city, County = county, PostalCode = postalCode, Country = country, IsMain = isMain },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateAddressAsync(
        Guid id, Guid clinicId, string addressType, string street, string city,
        string county, string? postalCode, string country, bool isMain, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                ClinicProcedures.AddressUpdate,
                new { Id = id, ClinicId = clinicId, AddressType = addressType, Street = street, City = city, County = county, PostalCode = postalCode, Country = country, IsMain = isMain },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task DeleteAddressAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                ClinicProcedures.AddressDelete,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    // ── Date de contact ──────────────────────────────────────────────────────

    public async Task<Guid> CreateContactAsync(
        Guid clinicId, string contactType, string value, string? label,
        bool isMain, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                ClinicProcedures.ContactCreate,
                new { ClinicId = clinicId, ContactType = contactType, Value = value, Label = label, IsMain = isMain },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateContactAsync(
        Guid id, Guid clinicId, string contactType, string value,
        string? label, bool isMain, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                ClinicProcedures.ContactUpdate,
                new { Id = id, ClinicId = clinicId, ContactType = contactType, Value = value, Label = label, IsMain = isMain },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task DeleteContactAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                ClinicProcedures.ContactDelete,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    // ── Persoane de contact ──────────────────────────────────────────────────

    public async Task<Guid> CreateContactPersonAsync(
        Guid clinicId, string name, string? function,
        string? phoneNumber, string? email, bool isMain, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                ClinicProcedures.ContactPersonCreate,
                new { ClinicId = clinicId, Name = name, Function = function, PhoneNumber = phoneNumber, Email = email, IsMain = isMain },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateContactPersonAsync(
        Guid id, Guid clinicId, string name, string? function,
        string? phoneNumber, string? email, bool isMain, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                ClinicProcedures.ContactPersonUpdate,
                new { Id = id, ClinicId = clinicId, Name = name, Function = function, PhoneNumber = phoneNumber, Email = email, IsMain = isMain },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task DeleteContactPersonAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                ClinicProcedures.ContactPersonDelete,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
