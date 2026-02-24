namespace ValyanClinic.Application.Common.Constants;

/// <summary>
/// Mesaje de eroare standardizate folosite în handlere și validatori.
/// </summary>
public static class ErrorMessages
{
    public static class Patient
    {
        public const string CnpDuplicate = "Un pacient cu acest CNP există deja.";
        public const string NotFound     = "Pacientul nu a fost găsit.";
    }

    public static class Appointment
    {
        public const string Conflict = "Există deja o programare în acest interval orar.";
        public const string NotFound = "Programarea nu a fost găsită.";
    }

    public static class Consultation
    {
        public const string NotFound = "Consultația nu a fost găsită.";
    }

    public static class Prescription
    {
        public const string NotFound = "Rețeta nu a fost găsită.";
        public const string Expired  = "Rețeta a expirat și nu mai poate fi modificată.";
    }

    public static class Invoice
    {
        public const string AlreadyPaid = "Factura este deja achitată.";
        public const string NotFound    = "Factura nu a fost găsită.";
    }

    public static class Auth
    {
        public const string InvalidCredentials = "Email sau parolă incorectă.";
        public const string AccountLocked      = "Contul a fost blocat. Contactați administratorul.";
        public const string InvalidToken       = "Token-ul de autentificare este invalid sau expirat.";
    }

    public static class User
    {
        public const string EmailDuplicate = "Un utilizator cu această adresă de email există deja.";
        public const string NotFound       = "Utilizatorul nu a fost găsit.";
    }

    public static class Doctor
    {
        public const string NotFound = "Doctorul nu a fost găsit.";
    }

    public static class MedicalDocument
    {
        public const string NotFound = "Documentul medical nu a fost găsit.";
    }

    public static class Specialty
    {
        public const string NotFound      = "Specializarea nu a fost găsită.";
        public const string CodeDuplicate = "O specializare cu acest cod există deja.";
        public const string ParentNotFound = "Specializarea părinte nu a fost găsită.";
        public const string SelfParent    = "O specializare nu poate fi propria sa părinte.";
    }

    public static class Clinic
    {
        public const string NotFound           = "Clinica nu a fost găsită.";
        public const string FiscalCodeDuplicate = "O clinică cu acest CUI/CIF există deja.";
    }

    public static class ClinicLocation
    {
        public const string NotFound = "Locația nu a fost găsită.";
    }
}
