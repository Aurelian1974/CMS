using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace ValyanClinic.Infrastructure.Data;

/// <summary>
/// Fabrică pentru conexiuni Dapper la SQL Server.
/// Toate conexiunile sunt create fresh — Dapper gestionează connection pooling prin ADO.NET.
/// </summary>
public sealed class DapperContext(IConfiguration configuration)
{
    private readonly string _connectionString =
        configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("Connection string 'DefaultConnection' nu a fost găsit în configurație.");

    /// <summary>Creează o nouă conexiune la baza de date.</summary>
    public IDbConnection CreateConnection() => new SqlConnection(_connectionString);
}
