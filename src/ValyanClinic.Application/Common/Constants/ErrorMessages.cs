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
        public const string InvalidCredentials = "Email/username sau parola incorectă.";
        public const string AccountLocked      = "Contul este blocat temporar. Încercați din nou după {0} minute.";
        public const string AccountInactive    = "Contul este dezactivat. Contactați administratorul.";
        public const string InvalidToken       = "Token-ul de autentificare este invalid sau expirat.";
    }

    public static class User
    {
        public const string EmailDuplicate          = "Un utilizator cu această adresă de email există deja.";
        public const string UsernameDuplicate        = "Un utilizator cu acest username există deja.";
        public const string NotFound                = "Utilizatorul nu a fost găsit.";
        public const string InvalidAssociation      = "Utilizatorul trebuie asociat fie unui doctor, fie unui membru al personalului medical.";
        public const string InvalidDoctor           = "Doctorul selectat nu există sau nu aparține acestei clinici.";
        public const string InvalidMedicalStaff     = "Personalul medical selectat nu există sau nu aparține acestei clinici.";
        public const string InvalidRole             = "Rolul selectat nu există sau nu este activ.";
        public const string DoctorAlreadyLinked     = "Acest doctor are deja un cont de utilizator asociat.";
        public const string MedicalStaffAlreadyLinked = "Acest membru al personalului medical are deja un cont de utilizator asociat.";
        public const string PasswordTooShort        = "Parola trebuie să aibă minimum 6 caractere.";
    }

    public static class Doctor
    {
        public const string NotFound           = "Doctorul nu a fost găsit.";
        public const string EmailDuplicate     = "Un doctor cu această adresă de email există deja.";
        public const string InvalidDepartment  = "Departamentul selectat nu există sau nu aparține acestei clinici.";
        public const string InvalidSupervisor  = "Supervizorul selectat nu există sau nu aparține acestei clinici.";
        public const string CircularSupervisor = "Un doctor nu poate fi propriul său supervizor.";
        public const string InvalidSubspecialty = "Subspecialitatea selectată nu este validă pentru specializarea aleasă.";
        public const string InvalidMedicalTitle = "Titulatura medicală selectată nu există sau nu este activă.";
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

    public static class Department
    {
        public const string NotFound          = "Departamentul nu a fost găsit.";
        public const string CodeDuplicate     = "Un departament cu acest cod există deja.";
        public const string InvalidLocation   = "Locația selectată nu există sau nu aparține acestei clinici.";
        public const string InvalidHeadDoctor = "Doctorul selectat ca șef de departament nu există.";
    }

    public static class MedicalTitle
    {
        public const string NotFound      = "Titulatura medicală nu a fost găsită.";
        public const string CodeDuplicate = "Există deja o titulatură cu acest cod.";
    }

    public static class MedicalStaffMember
    {
        public const string NotFound            = "Membrul personalului medical nu a fost găsit.";
        public const string EmailDuplicate      = "Un membru al personalului medical cu această adresă de email există deja.";
        public const string InvalidDepartment   = "Departamentul selectat nu există sau nu aparține acestei clinici.";
        public const string InvalidSupervisor   = "Supervizorul (doctorul) selectat nu există sau nu aparține acestei clinici.";
        public const string InvalidMedicalTitle = "Titulatura medicală selectată nu există sau nu este activă.";
    }
}
