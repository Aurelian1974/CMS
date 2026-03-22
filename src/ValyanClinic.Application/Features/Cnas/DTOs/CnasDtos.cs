namespace ValyanClinic.Application.Features.Cnas.DTOs;

public sealed record CnasSyncLogUpdateDto(
    Guid Id,
    string Status,
    string? ErrorMessage,
    string? NomenclatorVersion,
    string? UrlNomenclator,
    string? UrlLista,
    int? DrugsInserted,
    int? DrugsUpdated,
    int? CompensatedInserted,
    int? CompensatedUpdated,
    int? ActiveSubstsInserted,
    int? DurationSeconds
);

public sealed record CnasSyncStatusDto(
    Guid Id,
    string Status,
    DateTime StartedAt,
    DateTime? FinishedAt,
    string? NomenclatorVersion,
    string? ErrorMessage,
    int? DrugsInserted,
    int? DrugsUpdated,
    int? CompensatedInserted,
    int? CompensatedUpdated,
    int? ActiveSubstsInserted,
    int? DurationSeconds
);

public sealed record CnasSyncHistoryDto(
    Guid Id,
    DateTime StartedAt,
    DateTime? FinishedAt,
    string Status,
    string? NomenclatorVersion,
    int? DrugsInserted,
    int? DrugsUpdated,
    int? CompensatedInserted,
    int? CompensatedUpdated,
    int? ActiveSubstsInserted,
    int? DurationSeconds,
    string? TriggeredBy,
    string? ErrorMessage
);

public sealed record CnasSyncStatsDto(
    DateTime? LastSyncAt,
    string? LastSyncVersion,
    string? LastSyncStatus,
    int TotalDrugs,
    int ActiveDrugs,
    int CompensatedDrugs
);

public sealed record CnasDrugSearchDto(
    string Code,
    string Name,
    string? ActiveSubstance,
    string? PrescriptionMode,
    string? PharmaceuticalForm,
    string? AtcCode,
    bool IsCompensated
);

// ── Nomenclator paginat ───────────────────────────────────────────────────────

public sealed record CnasDrugDto(
    string Code,
    string Name,
    string? ActiveSubstanceCode,
    string? PharmaceuticalForm,
    string? PresentationMode,
    string? Concentration,
    string? PrescriptionMode,
    string? AtcCode,
    decimal? PricePerPackage,
    bool IsNarcotic,
    bool IsBrand,
    bool IsActive,
    bool IsCompensated,
    string? Company
);

public sealed record CnasCompensatedDrugDto(
    int Id,
    string DrugCode,
    string DrugName,
    string CopaymentListType,
    string? NhpCode,
    string? DiseaseCode,
    decimal? MaxPrice,
    decimal? CopaymentValue,
    DateTime? ValidFrom,
    DateTime? ValidTo,
    bool IsActive
);

public sealed record CnasActiveSubstanceDto(
    string Code,
    DateTime? ValidFrom
);

public sealed record CnasAtcCodeDto(
    string Code,
    string? Description,
    string? ParentATC
);

public sealed record CnasIcd10Dto(
    string Code,
    string Name,
    string? DiseaseCategoryCode,
    DateTime? ValidFrom,
    DateTime? ValidTo,
    bool IsActive
);
