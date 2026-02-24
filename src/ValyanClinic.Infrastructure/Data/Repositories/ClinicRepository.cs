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
        return await connection.QueryFirstOrDefaultAsync<ClinicDto>(
            new CommandDefinition(
                ClinicProcedures.GetById,
                new { Id = id },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
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
        string? caenCode, string? legalRepresentative, string? contractCnas,
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
                    CaenCode = caenCode,
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
        string? caenCode, string? legalRepresentative, string? contractCnas,
        string address, string city, string county, string? postalCode,
        string? bankName, string? bankAccount,
        string? email, string? phoneNumber, string? website,
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
                    CaenCode = caenCode,
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
}
