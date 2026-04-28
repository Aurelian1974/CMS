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
    public const int ConsultationLocked   = 50021;

    // ====== Investigații paraclinice ======
    public const int InvestigationTypeInvalid = 50022;
    public const int InvestigationNotFound    = 50023;

    // ====== Facturi ======
    public const int InvoiceAlreadyPaid = 50030;
    public const int InvoiceNotFound    = 50031;

    // ====== Rețete ======
    public const int PrescriptionExpired  = 50040;
    public const int PrescriptionNotFound = 50041;

    // ====== Autentificare ======
    public const int AuthInvalidCredentials = 50050;
    public const int AuthAccountLocked      = 50051;

    // ====== Utilizatori (range real: 50500–50508) ======
    // IMPORTANT: SP-urile aruncă coduri 50500+ (nu 50060/50061 care sunt obsolete)
    public const int UserEmailDuplicate          = 50500;
    public const int UserInvalidAssociation      = 50501; // nu poate fi și doctor și personal medical
    public const int UserInvalidDoctor           = 50502;
    public const int UserInvalidMedicalStaff     = 50503;
    public const int UserInvalidRole             = 50504;
    public const int UserDoctorAlreadyLinked     = 50505;
    public const int UserMedicalStaffAlreadyLinked = 50506;
    public const int UserNotFound                = 50507;
    public const int UserUsernameDuplicate       = 50508;

    // ====== Specialități (nomenclator) ======
    public const int SpecialtyCodeDuplicate    = 50100;
    public const int SpecialtyParentNotFound   = 50101;
    public const int SpecialtyNotFound         = 50102;
    public const int SpecialtyCircularRef      = 50103;

    // ====== Titlări medicale (nomenclator) ======
    // Nota: SP-urile MedicalTitle folosesc același range 50300 ca și Doctors.
    // Codurile se interpretează exclusiv în contextul SP-ului care le aruncă.
    public const int MedicalTitleCodeDuplicate = 50300;
    public const int MedicalTitleNotFound      = 50301;

    // ====== Clinici ======
    public const int ClinicFiscalCodeDuplicate = 50200;
    public const int ClinicNotFound            = 50201;

    // ====== Locații clinică ======
    public const int ClinicLocationNotFound = 50210;

    // ====== Departamente ======
    public const int DepartmentNotFound          = 50220;
    public const int DepartmentCodeDuplicate     = 50221;
    public const int DepartmentInvalidLocation   = 50222;
    public const int DepartmentInvalidHeadDoctor = 50223;

    // ====== Conturi bancare clinică ======
    public const int ClinicBankAccountNotFound = 50250;

    // ====== Adrese clinică ======
    public const int ClinicAddressNotFound = 50260;

    // ====== Contacte clinică ======
    public const int ClinicContactNotFound = 50270;

    // ====== Persoane de contact clinică ======
    public const int ClinicContactPersonNotFound = 50280;

    // ====== Doctori (range 50300–50306) ======
    // Nota: SP-urile Doctors utilizează același range ca și MedicalTitle (50300-50301).
    // Codurile se interpretează exclusiv în contextul SP-ului care le aruncă.
    public const int DoctorNotFound             = 50300;
    public const int DoctorEmailDuplicate       = 50301;
    public const int DoctorInvalidDepartment    = 50302;
    public const int DoctorInvalidSupervisor    = 50303;
    public const int DoctorInvalidSpecialty     = 50304;
    public const int DoctorAlreadyLinkedToUser  = 50305;
    public const int DoctorInvalidClinic        = 50306;

    // ====== Personal medical ======
    public const int MedicalStaffNotFound               = 50400;
    public const int MedicalStaffEmailDuplicate         = 50401;
    public const int MedicalStaffInvalidDepartment      = 50402;
    public const int MedicalStaffInvalidSupervisor      = 50403;
    public const int MedicalStaffAlreadyLinkedToUser    = 50406;
}
