namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru entitatea Appointment.</summary>
public static class AppointmentProcedures
{
    public const string GetById        = "dbo.Appointment_GetById";
    public const string GetPaged       = "dbo.Appointment_GetPaged";
    public const string GetByDoctor    = "dbo.Appointment_GetByDoctor";
    public const string GetByPatient   = "dbo.Appointment_GetByPatient";
    public const string Create         = "dbo.Appointment_Create";
    public const string Update         = "dbo.Appointment_Update";
    public const string UpdateStatus   = "dbo.Appointment_UpdateStatus";
    public const string Delete         = "dbo.Appointment_Delete";
    public const string CheckConflict  = "dbo.Appointment_CheckConflict";
}
