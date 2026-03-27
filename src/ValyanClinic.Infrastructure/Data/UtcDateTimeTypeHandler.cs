using System.Data;
using Dapper;

namespace ValyanClinic.Infrastructure.Data;

/// <summary>
/// Handler Dapper care marchează toate valorile DateTime citite din SQL Server ca UTC,
/// astfel încât System.Text.Json le serializează cu sufixul 'Z' și browser-ul
/// poate converti corect ora UTC → ora locală.
/// </summary>
public sealed class UtcDateTimeTypeHandler : SqlMapper.TypeHandler<DateTime>
{
    public override void SetValue(IDbDataParameter parameter, DateTime value)
        => parameter.Value = value;

    public override DateTime Parse(object value)
        => DateTime.SpecifyKind((DateTime)value, DateTimeKind.Utc);
}
