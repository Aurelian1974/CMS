namespace ValyanClinic.Application.Features.Anm.DTOs;

/// <summary>DTO pentru un job de sincronizare ANM (status polling).</summary>
public sealed record AnmSyncStatusDto(
    Guid     Id,
    string   Status,
    DateTime StartedAt,
    DateTime? FinishedAt,
    int?     TotalProcessed,
    int?     TotalInserted,
    int?     TotalUpdated,
    int?     DurationSeconds,
    string?  ErrorMessage
);

/// <summary>DTO pentru o intrare din istoricul sincronizărilor ANM.</summary>
public sealed record AnmSyncHistoryDto(
    Guid     Id,
    DateTime StartedAt,
    DateTime? FinishedAt,
    string   Status,
    int?     TotalProcessed,
    int?     TotalInserted,
    int?     TotalUpdated,
    int?     DurationSeconds,
    string?  TriggeredBy,
    string?  ErrorMessage
);

/// <summary>Statistici curente despre nomenclatorul ANM.</summary>
public sealed record AnmSyncStatsDto(
    DateTime? LastSyncAt,
    string?   LastSyncStatus,
    int       TotalDrugs,
    int       ActiveDrugs
);

/// <summary>DTO intern necesar pentru actualizarea log-ului de sync ANM.</summary>
public sealed record AnmSyncLogUpdateDto(
    Guid    Id,
    string  Status,
    int?    TotalProcessed,
    int?    TotalInserted,
    int?    TotalUpdated,
    int?    DurationSeconds,
    string? ErrorMessage
);
