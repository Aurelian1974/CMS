using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Dashboard.DTOs;

namespace ValyanClinic.Application.Features.Dashboard.Queries.GetDashboard;

/// <summary>Doar parametri cosmetici: tot ce restrânge datele se derivă pe server.</summary>
public sealed record GetDashboardQuery(int TrendDays = 30) : IRequest<Result<DashboardDto>>;
