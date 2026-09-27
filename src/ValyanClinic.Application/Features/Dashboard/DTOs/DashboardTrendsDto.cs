namespace ValyanClinic.Application.Features.Dashboard.DTOs;

public sealed record DashboardTrendsDto
{
    public IReadOnlyList<DashboardRevenuePointDto>? Revenue { get; init; }
    public IReadOnlyList<DashboardAppointmentPointDto>? Appointments { get; init; }
    public DashboardNoShowDto? NoShow { get; init; }
    public IReadOnlyList<DashboardDoctorWorkloadDto>? DoctorWorkload { get; init; }
    public IReadOnlyList<DashboardTopServiceDto>? TopServices { get; init; }
}
