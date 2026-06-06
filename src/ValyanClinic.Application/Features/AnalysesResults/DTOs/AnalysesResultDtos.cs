namespace ValyanClinic.Application.Features.AnalysesResults.DTOs;

/// <summary>Header buletin de analize — fara linii detaliu (folosit in liste).</summary>
public sealed record AnalysesResultListDto
{
    public Guid    Id             { get; init; }
    public Guid    ClinicId       { get; init; }
    public Guid    PatientId      { get; init; }
    public string  PatientName    { get; init; } = string.Empty;
    public Guid?   ConsultationId { get; init; }
    public string? Laboratory     { get; init; }
    public string? BulletinNumber { get; init; }
    public DateOnly CollectionDate { get; init; }
    public DateOnly ResultDate     { get; init; }
    public string? DoctorName     { get; init; }
    public DateTime CreatedAt     { get; init; }
    public Guid    CreatedBy      { get; init; }
}

/// <summary>O linie de rezultat din buletin.</summary>
public sealed record AnalysesResultDetailRowDto
{
    public Guid    Id             { get; init; }
    public Guid    ResultId       { get; init; }
    public string  Section        { get; init; } = "GENERAL";
    public string  TestName       { get; init; } = string.Empty;
    public string  Value          { get; init; } = string.Empty;
    public string? Unit           { get; init; }
    public string? ReferenceRange { get; init; }
    public decimal? RefMin        { get; init; }
    public decimal? RefMax        { get; init; }
    public string? Flag           { get; init; }
    public string? Method         { get; init; }
    public string? Notes          { get; init; }
    public string? Category       { get; init; }
    public string? Subcategory    { get; init; }
    public int     SortOrder      { get; init; }
}

/// <summary>Header + linii detaliu (folosit in GetById).</summary>
public sealed record AnalysesResultDetailDto
{
    public Guid    Id             { get; init; }
    public Guid    ClinicId       { get; init; }
    public Guid    PatientId      { get; init; }
    public string  PatientName    { get; init; } = string.Empty;
    public Guid?   ConsultationId { get; init; }
    public string? Laboratory     { get; init; }
    public string? BulletinNumber { get; init; }
    public DateOnly CollectionDate { get; init; }
    public DateOnly ResultDate     { get; init; }
    public string? DoctorName     { get; init; }
    public DateTime CreatedAt     { get; init; }
    public Guid    CreatedBy      { get; init; }
    public DateTime? UpdatedAt    { get; init; }
    public Guid?   UpdatedBy      { get; init; }
    public IReadOnlyList<AnalysesResultDetailRowDto> Details { get; init; } = [];
}

/// <summary>Header buletin pentru scrisoarea medicala (fara date de audit/tenant).</summary>
public sealed record AnalysesResultForLetterHeaderDto
{
    public Guid    Id             { get; init; }
    public string? Laboratory     { get; init; }
    public string? BulletinNumber { get; init; }
    public DateOnly CollectionDate { get; init; }
    public DateOnly ResultDate     { get; init; }
    public string? DoctorName     { get; init; }
    public IReadOnlyList<AnalysesResultDetailRowDto> Details { get; init; } = [];
}

/// <summary>Raspuns complet cu toate buletinele + detalii pentru o consultatie — folosit in scrisoarea medicala.</summary>
public sealed record AnalysesResultsForLetterResponse
{
    public IReadOnlyList<AnalysesResultForLetterHeaderDto> Bulletins { get; init; } = [];
}

/// <summary>Date pentru crearea/actualizarea unui buletin.</summary>
public sealed record AnalysesResultSaveData
{
    public Guid    ClinicId       { get; init; }
    public Guid    PatientId      { get; init; }
    public Guid?   ConsultationId { get; init; }
    public string? Laboratory     { get; init; }
    public string? BulletinNumber { get; init; }
    public DateOnly CollectionDate { get; init; }
    public DateOnly? ResultDate   { get; init; }
    public string? DoctorName     { get; init; }
    public string  DetailsJson    { get; init; } = "[]";
}
