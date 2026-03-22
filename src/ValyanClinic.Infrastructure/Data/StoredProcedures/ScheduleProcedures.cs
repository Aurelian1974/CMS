namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

public static class ScheduleProcedures
{
    public const string ClinicScheduleGetByClinic       = "dbo.ClinicSchedule_GetByClinic";
    public const string ClinicScheduleUpsert            = "dbo.ClinicSchedule_Upsert";
    public const string DoctorScheduleGetByClinic       = "dbo.DoctorSchedule_GetByClinic";
    public const string DoctorScheduleGetByDoctor       = "dbo.DoctorSchedule_GetByDoctor";
    public const string DoctorScheduleUpsert            = "dbo.DoctorSchedule_Upsert";
    public const string DoctorScheduleDelete            = "dbo.DoctorSchedule_Delete";
}
