using System.Data;
using Dapper;

namespace ValyanClinic.Infrastructure.Data;

/// <summary>
/// Handler Dapper pentru tipul DateOnly — SQL Server returnează DATE ca DateTime,
/// iar Dapper nu știe să îl convertească automat la DateOnly.
/// </summary>
public sealed class DateOnlyTypeHandler : SqlMapper.TypeHandler<DateOnly>
{
    public override void SetValue(IDbDataParameter parameter, DateOnly value)
    {
        parameter.DbType = DbType.Date;
        parameter.Value  = value.ToDateTime(TimeOnly.MinValue);
    }

    public override DateOnly Parse(object value)
        => DateOnly.FromDateTime((DateTime)value);
}

/// <summary>
/// Handler Dapper pentru tipul DateOnly? (nullable).
/// </summary>
public sealed class NullableDateOnlyTypeHandler : SqlMapper.TypeHandler<DateOnly?>
{
    public override void SetValue(IDbDataParameter parameter, DateOnly? value)
    {
        parameter.DbType = DbType.Date;
        parameter.Value  = value.HasValue
            ? value.Value.ToDateTime(TimeOnly.MinValue)
            : DBNull.Value;
    }

    public override DateOnly? Parse(object value)
        => value is null or DBNull ? null : DateOnly.FromDateTime((DateTime)value);
}
