// ============================================================
// Global usings pentru ValyanClinic.API
// Necesare pentru atributele [ProducesResponseType<T>] de pe controllere
// ============================================================

// Modele comune — ApiResponse<T>, PagedResult<T>, Result<T>
global using ValyanClinic.Application.Common.Models;

// Feature DTOs cu folder propriu
global using ValyanClinic.Application.Features.Appointments.DTOs;
global using ValyanClinic.Application.Features.AuditLogs.DTOs;
global using ValyanClinic.Application.Features.Clinics.DTOs;
global using ValyanClinic.Application.Features.Cnas.DTOs;
global using ValyanClinic.Application.Features.Departments.DTOs;
global using ValyanClinic.Application.Features.Doctors.DTOs;
global using ValyanClinic.Application.Features.MedicalStaff.DTOs;
global using ValyanClinic.Application.Features.Patients.DTOs;
global using ValyanClinic.Application.Features.Schedule.DTOs;
global using ValyanClinic.Application.Features.Users.DTOs;

// Tipuri composite definite inline în namespace-ul query-ului
global using ValyanClinic.Application.Features.Appointments.Queries.GetAppointments;   // AppointmentsPagedResponse
global using ValyanClinic.Application.Features.Patients.Queries.GetPatients;           // PatientsPagedResponse
global using ValyanClinic.Application.Features.Patients.Queries.GetPatientById;        // PatientFullDetailDto

// Nomenclatoare — DTO-uri co-locate cu query-urile lor
global using ValyanClinic.Application.Features.Nomenclature.Queries.GetCaenCodes;          // CaenCodeDto
global using ValyanClinic.Application.Features.Nomenclature.Queries.GetCounties;           // CountyDto
global using ValyanClinic.Application.Features.Nomenclature.Queries.GetLocalities;         // LocalityDto
global using ValyanClinic.Application.Features.Nomenclature.Queries.GetMedicalTitles;      // MedicalTitleDto
global using ValyanClinic.Application.Features.Nomenclature.Queries.GetNomenclatureLookup; // NomenclatureLookupDto
global using ValyanClinic.Application.Features.Nomenclature.Queries.GetSpecialties;        // SpecialtyDto
global using ValyanClinic.Application.Features.Nomenclature.Queries.GetSpecialtyTree;      // SpecialtyTreeNodeDto

// Permisiuni — DTO-uri definite în Common.Interfaces (folosite de mai multe namespace-uri)
global using ValyanClinic.Application.Common.Interfaces;                                        // RoleModulePermissionDto, UserOverrideDto, UserModulePermissionDto
global using ValyanClinic.Application.Features.Permissions.Queries.GetModulesAndLevels;        // ModulesAndLevelsDto
