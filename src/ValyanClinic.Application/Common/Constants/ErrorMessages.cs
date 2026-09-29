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
        public const string Conflict          = "Există deja o programare în acest interval orar.";
        public const string NotFound          = "Programarea nu a fost găsită.";
        public const string InvalidStatus     = "Statusul selectat nu este valid.";
        public const string HasConsultation   = "Programarea are o consultație asociată și nu poate fi ștearsă.";
        public const string OutsideSchedule   = "Intervalul selectat este în afara programului clinicii sau al doctorului.";
        public const string InvalidTransition = "Tranziția de status nu este permisă.";
        public const string InvalidTimeRange  = "Ora de sfârșit trebuie să fie după ora de început.";
        public const string Concurrency       = "Programarea a fost modificată de alt utilizator. Reîncarcă datele.";
        public const string ScheduleOverrideForbidden =
            "Nu aveți dreptul să creați programări în afara programului de lucru.";
    }

    public static class Consultation
    {
        public const string NotFound             = "Consultația nu a fost găsită.";
        public const string Locked               = "Consultația nu mai este în lucru și nu poate fi modificată.";
        public const string DeleteBlocked        = "Consultația este blocată sau facturată și nu poate fi ștearsă.";
        public const string HasPayments          = "Consultația are încasări înregistrate și nu poate fi ștearsă.";
        public const string AppointmentDuplicate = "Există deja o consultație pentru această programare.";
        public const string MissingPrimaryDiagnosis = "Diagnosticul principal este obligatoriu la finalizare.";
    }

    public static class Investigation
    {
        public const string NotFound      = "Investigația nu a fost găsită.";
        public const string TypeInvalid   = "Tipul de investigație nu este valid sau este inactiv.";
        public const string DocumentNotFound = "Documentul atașat nu a fost găsit.";
    }

    public static class RecommendedAnalysis
    {
        public const string NotFound      = "Analiza recomandată nu a fost găsită.";
        public const string AnalysisNotInDictionary = "Analiza nu există în dicționar.";
    }

    public static class ConsultationMedication
    {
        public const string NotFound             = "Medicamentul din tratament nu a fost găsit.";
        public const string DrugNotFound         = "Medicamentul nu există în nomenclatorul CNAS sau nu mai este activ.";
        public const string CopaymentListInvalid = "Medicamentul nu este compensat pe lista selectată.";
    }

    public static class AnalysesResult
    {
        public const string NotFound = "Buletinul de analize nu a fost găsit.";
    }

    public static class Prescription
    {
        public const string NotFound          = "Rețeta nu a fost găsită.";
        public const string Expired           = "Rețeta a expirat și nu mai poate fi modificată.";
        public const string SipeNotConfigured =
            "Transmiterea în SIPE nu este configurată. Rețeta rămâne emisă; transmiteți-o din aplicația CNAS sau configurați integrarea.";
        public const string SipeTransmissionFailed = "Transmiterea în SIPE a eșuat: {0}";
        public const string NotTransmittable =
            "Doar rețetele compensate emise (netransmise) pot fi transmise în SIPE.";
    }

    public static class Invoice
    {
        public const string NotFound = "Factura nu a fost găsită.";
    }

    public static class Tariff
    {
        public const string ServiceNotFound = "Serviciul nu a fost găsit.";
        public const string VatRateNotFound = "Regimul TVA nu a fost găsit.";
    }

    public static class Billing
    {
        public const string ConsultationServiceNotFound = "Linia de serviciu nu a fost găsită.";
        public const string PaymentNotFound             = "Încasarea nu a fost găsită.";
        public const string FiscalReceiptNotFound       = "Bonul fiscal nu a fost găsit.";
        public const string InvoiceSeriesNotFound       = "Seria de facturi nu a fost găsită.";
    }

    public static class Auth
    {
        public const string InvalidCredentials = "Email/username sau parola incorectă.";
        public const string AccountLocked      = "Contul este blocat temporar. Încercați din nou după {0} minute.";
        public const string AccountInactive    = "Contul este dezactivat. Contactați administratorul.";
        public const string InvalidToken       = "Token-ul de autentificare este invalid sau expirat.";
        public const string SessionExpiredIdle =
            "Sesiunea a expirat din lipsă de activitate. Autentificați-vă din nou.";
        public const string TokenReuseDetected = "Sesiunea a fost invalidată din motive de securitate. Autentificați-vă din nou.";
    }

    public static class User
    {
        public const string EmailDuplicate          = "Un utilizator cu această adresă de email există deja.";
        public const string UsernameDuplicate        = "Un utilizator cu acest username există deja.";
        public const string NotFound                = "Utilizatorul nu a fost găsit.";
        public const string CurrentPasswordIncorrect = "Parola curentă este incorectă.";
        public const string PasswordUnchanged        = "Parola nouă trebuie să fie diferită de cea curentă.";
        public const string PasswordRecentlyUsed =
            "Parola a mai fost folosită recent. Alegeți una diferită de ultimele {0}.";
        public const string PasswordResetRequiresAdmin =
            "Doar un administrator poate reseta parola altui utilizator.";
        public const string UseSelfServiceForOwnPassword =
            "Pentru propria parolă folosiți schimbarea din contul dumneavoastră, care cere parola curentă.";
        public const string InvalidAssociation      = "Utilizatorul trebuie asociat unui doctor, unui membru al personalului medical sau al personalului administrativ.";
        public const string InvalidDoctor           = "Doctorul selectat nu există sau nu aparține acestei clinici.";
        public const string InvalidMedicalStaff     = "Personalul medical selectat nu există sau nu aparține acestei clinici.";
        public const string InvalidAdministrativeStaff = "Personalul administrativ selectat nu există sau nu aparține acestei clinici.";
        public const string InvalidRole             = "Rolul selectat nu există sau nu este activ.";
        public const string DoctorAlreadyLinked     = "Acest doctor are deja un cont de utilizator asociat.";
        public const string MedicalStaffAlreadyLinked = "Acest membru al personalului medical are deja un cont de utilizator asociat.";
        public const string AdministrativeStaffAlreadyLinked = "Acest membru al personalului administrativ are deja un cont de utilizator asociat.";
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

    public static class ClinicBankAccount
    {
        public const string NotFound = "Contul bancar nu a fost găsit.";
    }

    public static class ClinicAddress
    {
        public const string NotFound = "Adresa nu a fost găsită.";
    }

    public static class ClinicContact
    {
        public const string NotFound = "Contactul nu a fost găsit.";
    }

    public static class ClinicContactPerson
    {
        public const string NotFound = "Persoana de contact nu a fost găsită.";
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

    public static class AdministrativeStaffMember
    {
        public const string NotFound          = "Membrul personalului administrativ nu a fost găsit.";
        public const string EmailDuplicate    = "Un membru al personalului administrativ cu această adresă de email există deja.";
        public const string InvalidDepartment = "Departamentul selectat nu există sau nu aparține acestei clinici.";
        public const string InvalidPosition   = "Funcția selectată nu există sau nu este activă.";
    }
}
