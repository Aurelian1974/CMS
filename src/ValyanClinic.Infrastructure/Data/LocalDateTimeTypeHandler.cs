using System.Data;
using Dapper;

namespace ValyanClinic.Infrastructure.Data;

/// <summary>
/// Handler Dapper care marchează toate valorile DateTime citite din SQL Server
/// ca Local (ora serverului = ora României), astfel încât System.Text.Json
/// le serializează fără sufixul 'Z' iar browser-ul le interpretează corect
/// ca oră locală fără conversie de fus orar.
/// </summary>
public sealed class LocalDateTimeTypeHandler : SqlMapper.TypeHandler<DateTime>
{
    public override void SetValue(IDbDataParameter parameter, DateTime value)
        => parameter.Value = value;

    public override DateTime Parse(object value)
        => DateTime.SpecifyKind((DateTime)value, DateTimeKind.Local);
}
