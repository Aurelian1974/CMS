namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>Date de scriere pentru Appointment_Create / Appointment_Update.</summary>
public sealed record AppointmentWriteData(
    Guid     ClinicId,
    Guid     PatientId,
    Guid     DoctorId,
    DateTime StartTime,
    DateTime EndTime,
    Guid?    StatusId,
    string?  Notes,
    bool     EnforceSchedule,
    Guid     ActorId);
