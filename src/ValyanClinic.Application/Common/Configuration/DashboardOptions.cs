namespace ValyanClinic.Application.Common.Configuration;

/// <summary>Parametrii dashboard-ului (secțiunea "Dashboard" din appsettings.json).</summary>
public sealed class DashboardOptions
{
    public const string SectionName = "Dashboard";

    /// <summary>Fusul orar al clinicii — definește „azi” independent de serverul SQL.</summary>
    public string TimeZoneId { get; init; } = "Europe/Bucharest";

    public int AgendaTop { get; init; } = 20;
    public int ListTop { get; init; } = 10;
    public int HealthTop { get; init; } = 15;

    /// <summary>Fereastra pentru „reveniri programabile”.</summary>
    public int FollowUpDays { get; init; } = 14;

    /// <summary>Vechimea maximă a buletinelor de analize „noi”.</summary>
    public int LabDays { get; init; } = 7;

    /// <summary>Orizontul de alertă pentru avize CMR și asigurări.</summary>
    public int ExpiryDays { get; init; } = 60;

    /// <summary>Restanțele mai vechi nu sunt lucru de zi, ci subiect de raport.</summary>
    public int BillableMonths { get; init; } = 6;

    public int SecurityWindowHours { get; init; } = 24;
}
