namespace ValyanClinic.Application.Features.Dashboard.DTOs;

/// <summary>Contoarele clinice; câmpurile ale căror widget-uri nu sunt permise rămân null.</summary>
public sealed record DashboardClinicalKpisDto
{
    public int? AppointmentsToday { get; init; }
    public int? AppointmentsTodayRemaining { get; init; }
    public int? ConsultationsToday { get; init; }
    public int? ConsultationsOpen { get; init; }
    public int? FollowUpsDue { get; init; }
    public int? PatientsNewThisMonth { get; init; }
    public int? PrescriptionsDraft { get; init; }
    public int? PrescriptionsWithTransmissionError { get; init; }
}
