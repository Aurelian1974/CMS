namespace ValyanClinic.Application.Common.Constants;

/// <summary>
/// Coduri de eroare SQL custom aruncate din Stored Procedures prin THROW (range 50000–59999).
/// Folosite în handlere pentru a prinde și transforma excepțiile în Result.Failure.
/// </summary>
public static class SqlErrorCodes
{
    // ====== Pacienți ======
    public const int PatientCnpDuplicate = 50001;
    public const int PatientNotFound     = 50002;

    // ====== Programări ======
    public const int AppointmentConflict  = 50010;
    public const int AppointmentNotFound  = 50011;

    // ====== Consultații ======
    public const int ConsultationNotFound = 50020;

    // ====== Facturi ======
    public const int InvoiceAlreadyPaid = 50030;
    public const int InvoiceNotFound    = 50031;

    // ====== Rețete ======
    public const int PrescriptionExpired  = 50040;
    public const int PrescriptionNotFound = 50041;

    // ====== Autentificare ======
    public const int AuthInvalidCredentials = 50050;
    public const int AuthAccountLocked      = 50051;

    // ====== Utilizatori ======
    public const int UserEmailDuplicate = 50060;
    public const int UserNotFound       = 50061;

    // ====== Specialități ======
    public const int SpecialtyCodeDuplicate = 50100;
    public const int SpecialtyParentNotFound = 50101;

    // ====== Clinici ======
    public const int ClinicFiscalCodeDuplicate = 50200;
    public const int ClinicNotFound            = 50201;

    // ====== Locații clinică ======
    public const int ClinicLocationNotFound = 50210;
}
