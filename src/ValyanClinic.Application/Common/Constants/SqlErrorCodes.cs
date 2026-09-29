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
    public const int AppointmentConflict           = 50010;
    public const int AppointmentNotFound           = 50011;
    public const int AppointmentPatientNotInClinic = 50012;
    public const int AppointmentDoctorNotInClinic  = 50013;
    public const int AppointmentInvalidStatus      = 50014;
    public const int AppointmentHasConsultation    = 50015;
    public const int AppointmentOutsideSchedule    = 50016;
    public const int AppointmentInvalidTransition  = 50017;
    public const int AppointmentInvalidTimeRange   = 50018;
    public const int AppointmentConcurrency        = 50019;

    // ====== Consultații ======
    public const int ConsultationNotFound = 50020;
    public const int ConsultationLocked   = 50021;
    public const int ConsultationHasPayments             = 50029;
    public const int ConsultationDeleteBlocked           = 50032;
    public const int ConsultationAppointmentDuplicate    = 50033;
    public const int ConsultationMissingPrimaryDiagnosis = 50034;
    public const int ConsultationAppointmentNotConfirmed = 50035;

    // ====== Investigații paraclinice ======
    public const int InvestigationTypeInvalid = 50022;
    public const int InvestigationNotFound    = 50023;

    // ====== Analize medicale (recomandate) ======
    public const int AnalysisNotFound              = 50024;
    public const int RecommendedAnalysisNotFound  = 50025;

    // ====== Tratament recomandat (medicamente CNAS pe consultație) ======
    public const int ConsultationMedicationNotFound = 50026;
    public const int CnasDrugNotFound               = 50027;
    public const int CopaymentListInvalid           = 50028;

    // ====== Buletine analize (AnalysesResults) ======
    public const int AnalysesResultNotFound = 50401;

    // ====== Modul financiar (range 50600–50699) ======
    // Facturare consultație
    public const int BillingConsultationNotFinalized = 50600;
    public const int BillingConsultationLocked       = 50601;
    public const int BillingNoServices               = 50602;
    public const int ConsultationServiceInvalidQty   = 50603;
    public const int ConsultationServiceNotFound     = 50604;
    public const int ConsultationServiceFromInvestigation = 50605;
    // Tarife
    public const int MedicalServiceCodeDuplicate = 50610;
    public const int MedicalServiceNotFound      = 50611;
    public const int MedicalServiceUnavailable   = 50612;
    public const int MedicalServiceConcurrency   = 50613;
    public const int MedicalServicePriceInvalid  = 50614;
    public const int ServiceCategoryInvalid      = 50615;
    public const int VatRateInvalid              = 50616;
    public const int VatRateCodeDuplicate        = 50617;
    public const int VatRateNotFound             = 50618;
    // Facturi
    public const int InvoiceNotFound              = 50620;
    public const int InvoiceAlreadyExists         = 50621;
    public const int InvoiceCorrectionNotAllowed  = 50622;
    public const int InvoiceSupplierIncomplete    = 50623;
    public const int InvoiceSeriesUnavailable     = 50624;
    public const int InvoiceSeriesDuplicate       = 50625;
    public const int InvoiceCannotStorno          = 50626;
    public const int InvoiceCustomerInvalid       = 50627;
    public const int InvoiceSeriesDefaultInactive = 50628;
    public const int InvoiceSeriesNotFound        = 50629;
    // Plăți
    public const int PaymentNotFound          = 50630;
    public const int PaymentExceedsBalance    = 50631;
    public const int PaymentAlreadyPaid       = 50632;
    public const int PaymentFiscalFullAmount  = 50633;
    public const int PaymentCannotCancel      = 50634;
    public const int PaymentMethodInvalid     = 50635;
    // Bonuri fiscale
    public const int FiscalReceiptNotFound          = 50640;
    public const int FiscalReceiptInvalidTransition = 50641;
    public const int FiscalMappingMissing           = 50642;
    public const int FiscalReceiptNumberRequired    = 50643;
    public const int FiscalReceiptUnresolved        = 50644;
    public const int FiscalDisabled                 = 50645;
    // Import investigații în tarife
    public const int InvestigationTypeNotBillable      = 50650;
    public const int InvestigationServiceAlreadyExists = 50651;
    public const int InvestigationServiceLinkLocked    = 50653;

    // ====== Rețete ======
    public const int PrescriptionExpired           = 50040;
    public const int PrescriptionNotFound          = 50041;
    public const int PrescriptionNotEditable       = 50042;
    public const int PrescriptionNoItems           = 50043;
    public const int PrescriptionCannotCancel      = 50044;
    public const int PrescriptionNothingToGenerate = 50045;
    public const int PrescriptionInvalidData       = 50046;
    public const int PrescriptionTreatmentInvalid  = 50047;
    public const int PrescriptionTooManyItems      = 50048;
    public const int PrescriptionNotTransmittable  = 50049;

    // ====== Autentificare ======
    public const int AuthInvalidCredentials = 50050;
    public const int AuthAccountLocked      = 50051;
    /// <summary>Refresh token-ul nu mai era activ la rotație (rotit concurent sau revocat).</summary>
    public const int RefreshTokenNotActive  = 50052;

    // ====== Utilizatori (range real: 50500–50510) ======
    // IMPORTANT: SP-urile aruncă coduri 50500+ (nu 50060/50061 care sunt obsolete)
    public const int UserEmailDuplicate          = 50500;
    public const int UserInvalidAssociation      = 50501; // exact o asociere: doctor / personal medical / personal administrativ
    public const int UserInvalidDoctor           = 50502;
    public const int UserInvalidMedicalStaff     = 50503;
    public const int UserInvalidRole             = 50504;
    public const int UserDoctorAlreadyLinked     = 50505;
    public const int UserMedicalStaffAlreadyLinked = 50506;
    public const int UserNotFound                = 50507;
    public const int UserUsernameDuplicate       = 50508;
    public const int UserInvalidAdministrativeStaff       = 50509;
    public const int UserAdministrativeStaffAlreadyLinked = 50510;

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

    // ====== Personal administrativ (range 50700–50703) ======
    public const int AdministrativeStaffNotFound          = 50700;
    public const int AdministrativeStaffEmailDuplicate    = 50701;
    public const int AdministrativeStaffInvalidDepartment = 50702;
    public const int AdministrativeStaffInvalidPosition   = 50703;
}
