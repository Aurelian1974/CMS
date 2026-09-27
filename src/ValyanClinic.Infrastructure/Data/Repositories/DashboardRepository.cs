using System.Data;
using Dapper;
using Microsoft.Extensions.Options;
using ValyanClinic.Application.Common.Configuration;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Dashboard.DTOs;
using ValyanClinic.Application.Features.Dashboard.Widgets;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

/// <summary>
/// Un SP per bundle, apelate secvențial. Ordinea citirilor oglindește ordinea
/// SELECT-urilor din fiecare SP (result sets fixe).
/// </summary>
public sealed class DashboardRepository(DapperContext context, IOptions<DashboardOptions> options)
    : IDashboardRepository
{
    private readonly DashboardOptions _options = options.Value;

    public async Task<DashboardRawData> GetAsync(DashboardQueryData query, CancellationToken ct)
    {
        var today = query.Today.ToDateTime(TimeOnly.MinValue);

        return new DashboardRawData(
            ClinicalKpis: query.Bundles.Contains(DashboardBundle.Clinical) ? await GetClinicalAsync(query, today, ct) : null,
            Agenda:       query.Bundles.Contains(DashboardBundle.Agenda)   ? await GetAgendaAsync(query, today, ct) : null,
            Financial:    query.Bundles.Contains(DashboardBundle.Financial) ? await GetFinancialAsync(query, today, ct) : null,
            Trends:       query.Bundles.Contains(DashboardBundle.Trend)    ? await GetTrendsAsync(query, today, ct) : null,
            Health:       query.Bundles.Contains(DashboardBundle.Health)   ? await GetHealthAsync(query, today, ct) : null);
    }

    private async Task<DashboardClinicalKpisDto> GetClinicalAsync(DashboardQueryData q, DateTime today, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QuerySingleAsync<DashboardClinicalKpisDto>(
            new CommandDefinition(
                DashboardProcedures.GetClinicalKpis,
                new
                {
                    q.ClinicId,
                    q.UserId,
                    Today = today,
                    q.OnlyMine,
                    _options.FollowUpDays
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    private async Task<DashboardAgendaDto> GetAgendaAsync(DashboardQueryData q, DateTime today, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                DashboardProcedures.GetAgenda,
                new
                {
                    q.ClinicId,
                    q.UserId,
                    Today = today,
                    q.OnlyMine,
                    q.IncludeClinical,
                    Top = _options.AgendaTop,
                    _options.LabDays
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        return new DashboardAgendaDto
        {
            Appointments      = (await multi.ReadAsync<DashboardAgendaItemDto>()).ToList(),
            OpenConsultations = (await multi.ReadAsync<DashboardOpenConsultationDto>()).ToList(),
            LabResults        = (await multi.ReadAsync<DashboardLabResultDto>()).ToList(),
        };
    }

    private async Task<DashboardFinancialDto> GetFinancialAsync(DashboardQueryData q, DateTime today, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                DashboardProcedures.GetFinancialKpis,
                new
                {
                    q.ClinicId,
                    Today = today,
                    BillableSince = today.AddMonths(-_options.BillableMonths),
                    Top = _options.ListTop
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        return new DashboardFinancialDto
        {
            Kpis          = await multi.ReadSingleAsync<DashboardFinancialKpisDto>(),
            Unpaid        = (await multi.ReadAsync<DashboardUnpaidItemDto>()).ToList(),
            ReceiptIssues = (await multi.ReadAsync<DashboardReceiptIssueDto>()).ToList(),
        };
    }

    private async Task<DashboardTrendsDto> GetTrendsAsync(DashboardQueryData q, DateTime today, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                DashboardProcedures.GetTrends,
                new
                {
                    q.ClinicId,
                    Today = today,
                    Days = q.TrendDays,
                    Top = _options.ListTop
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        return new DashboardTrendsDto
        {
            Revenue        = (await multi.ReadAsync<DashboardRevenuePointDto>()).ToList(),
            Appointments   = (await multi.ReadAsync<DashboardAppointmentPointDto>()).ToList(),
            NoShow         = await multi.ReadSingleAsync<DashboardNoShowDto>(),
            DoctorWorkload = (await multi.ReadAsync<DashboardDoctorWorkloadDto>()).ToList(),
            TopServices    = (await multi.ReadAsync<DashboardTopServiceDto>()).ToList(),
        };
    }

    private async Task<DashboardHealthDto> GetHealthAsync(DashboardQueryData q, DateTime today, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                DashboardProcedures.GetOperationalHealth,
                new
                {
                    q.ClinicId,
                    Today = today,
                    q.SinceUtc,
                    _options.ExpiryDays,
                    Top = _options.HealthTop
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        return new DashboardHealthDto
        {
            SecurityEvents    = (await multi.ReadAsync<DashboardSecurityEventDto>()).ToList(),
            LockedUsers       = (await multi.ReadAsync<DashboardLockedUserDto>()).ToList(),
            ExpiringLicenses  = (await multi.ReadAsync<DashboardExpiringLicenseDto>()).ToList(),
            ExpiringInsurance = (await multi.ReadAsync<DashboardExpiringInsuranceDto>()).ToList(),
            SyncFreshness     = (await multi.ReadAsync<DashboardSyncFreshnessDto>()).ToList(),
            Activity          = (await multi.ReadAsync<DashboardActivityDto>()).ToList(),
        };
    }
}
