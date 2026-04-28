using System.Text.Json;
using System.Text.Json.Serialization;

namespace ValyanClinic.Application.Features.Investigations.Payloads;

/// <summary>
/// Forme tipizate ale câmpului <c>StructuredData</c> per <c>InvestigationType</c>.
/// Folosite pentru validare server-side: handlerele deserializează JSON-ul după <c>InvestigationType</c>
/// pentru a verifica integritatea (intervale, prezență câmpuri obligatorii).
/// Toate câmpurile sunt opționale la nivel de schemă (validare suplimentară prin <see cref="Validators"/>).
/// </summary>
public static class InvestigationStructuredPayloads
{
    public static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };
}

// ───── Pneumology ─────
public sealed record SpirometryData(
    decimal? FVC, decimal? FVC_Predicted,
    decimal? FEV1, decimal? FEV1_Predicted,
    decimal? FEV1_FVC_Ratio,
    decimal? PEF, decimal? PEF_Predicted,
    decimal? FEF25_75, decimal? FEF25_75_Predicted,
    string? GOLD_Stage,
    bool? PostBronchodilator, decimal? Reversibility_Percent,
    string? Notes);

public sealed record DLCOData(
    decimal? DLCO, decimal? DLCO_Predicted,
    decimal? DLCO_VA, decimal? VA, decimal? KCO,
    string? Notes);

public sealed record ABGData(
    decimal? pH, decimal? PaO2, decimal? PaCO2,
    decimal? HCO3, decimal? BE, decimal? SaO2,
    decimal? Lactate,
    string? FiO2,
    string? Interpretation,
    string? Notes);

public sealed record OximetryData(
    decimal? SpO2_Rest, decimal? SpO2_Min, decimal? SpO2_Mean,
    decimal? HR_Rest, decimal? HR_Max,
    int? DesaturationIndex,
    decimal? TimeBelow90_Percent,
    string? Notes);

public sealed record SixMWTData(
    int? DistanceMeters, int? DistancePredictedMeters,
    decimal? SpO2_Start, decimal? SpO2_End, decimal? SpO2_Min,
    decimal? HR_Start, decimal? HR_End, decimal? HR_Max,
    int? Borg_Dyspnea_Start, int? Borg_Dyspnea_End,
    int? Borg_Fatigue_Start, int? Borg_Fatigue_End,
    int? StopsCount,
    bool? UsedSupplementalO2, decimal? O2_Lpm,
    string? Notes);

// ───── Cardiology ─────
public sealed record ECGData(
    string? Rhythm, int? HeartRate,
    int? PR_ms, int? QRS_ms, int? QT_ms, int? QTc_ms,
    string? Axis,
    bool? AtrialFibrillation, bool? LBBB, bool? RBBB,
    bool? LVH, bool? RVH,
    bool? STElevation, bool? STDepression, bool? TWaveInversion,
    string? Notes);

public sealed record EchocardiographyData(
    decimal? LVEF, decimal? LVEDD, decimal? LVESD,
    decimal? IVSd, decimal? PWd, decimal? LAVi,
    decimal? E_A_Ratio, decimal? E_e_Ratio,
    decimal? PASP, decimal? TAPSE,
    string? AorticValve, string? MitralValve, string? TricuspidValve, string? PulmonicValve,
    string? Notes);

public sealed record HolterECGData(
    int? DurationHours,
    int? AverageHR, int? MinHR, int? MaxHR,
    int? PVC_Count, int? PAC_Count,
    int? VT_Episodes, int? SVT_Episodes,
    bool? AFibDetected, decimal? AFibBurdenPercent,
    int? PausesOver2sec, int? LongestPause_ms,
    string? Notes);

public sealed record HolterBPData(
    int? DurationHours,
    decimal? Avg24hSBP, decimal? Avg24hDBP,
    decimal? AvgDaySBP, decimal? AvgDayDBP,
    decimal? AvgNightSBP, decimal? AvgNightDBP,
    decimal? NocturnalDipPercent,
    string? DipperPattern, // dipper/non-dipper/extreme/reverse
    string? Notes);

public sealed record StressTestData(
    string? Protocol, // Bruce/ModifiedBruce/Naughton
    int? DurationSeconds,
    int? METs,
    int? PeakHR, int? PeakSBP, int? PeakDBP,
    bool? STChanges, string? Symptoms,
    string? Conclusion,
    string? Notes);

// ───── Sleep ─────
public sealed record PSGSleepArchitecture(
    decimal? TST_min, decimal? SleepEfficiency,
    decimal? SleepLatency_min, decimal? REMLatency_min,
    decimal? N1_Percent, decimal? N2_Percent, decimal? N3_Percent, decimal? REM_Percent);

public sealed record PSGRespiratoryEvents(
    decimal? AHI_Total, decimal? AHI_REM, decimal? AHI_NREM,
    decimal? AHI_Supine, decimal? AHI_NonSupine,
    int? CentralApneas, int? ObstructiveApneas, int? MixedApneas, int? Hypopneas,
    decimal? RDI);

public sealed record PSGOximetry(
    decimal? SpO2_Mean, decimal? SpO2_Min,
    decimal? T90_Percent, decimal? ODI);

public sealed record PSGPLM(int? PLMI, int? PLMS_Index);

public sealed record PSGCardiac(int? AvgHR, int? MinHR, int? MaxHR);

public sealed record PSGPosition(decimal? SupinePercent, decimal? NonSupinePercent);

public sealed record PSGSnoring(decimal? SnoringPercent);

public sealed record PSGDiagnosticData(
    PSGSleepArchitecture? SleepArchitecture,
    PSGRespiratoryEvents? RespiratoryEvents,
    PSGOximetry? Oximetry,
    PSGPLM? PLM,
    PSGCardiac? Cardiac,
    PSGPosition? Position,
    PSGSnoring? Snoring,
    string? OSA_Severity, // None/Mild/Moderate/Severe
    string? Notes);

public sealed record PSGSplitNightData(
    PSGRespiratoryEvents? DiagnosticHalf,
    string? CPAP_PressureRange,
    PSGRespiratoryEvents? TitrationHalf,
    string? Notes);

public sealed record CPAPTitrationData(
    string? Device, // CPAP/BiPAP/AutoPAP
    decimal? OptimalPressure_cmH2O,
    decimal? IPAP, decimal? EPAP,
    decimal? ResidualAHI,
    string? MaskType,
    string? Notes);

public sealed record CPAPFollowUpData(
    decimal? UsageHoursPerNight,
    decimal? AdherencePercent,
    decimal? ResidualAHI,
    decimal? LeakLpm,
    string? PatientReportedSymptoms,
    string? Notes);

// ───── Metabolic ─────
public sealed record TTGOData(
    decimal? Glucose_0min, decimal? Glucose_60min, decimal? Glucose_120min,
    decimal? Insulin_0min, decimal? Insulin_60min, decimal? Insulin_120min,
    string? Interpretation, // Normal/IFG/IGT/DM
    string? Notes);

// ───── Questionnaires (auto-scored on FE; backend stores answers + score) ─────
public sealed record EpworthData(
    int? Q1, int? Q2, int? Q3, int? Q4, int? Q5, int? Q6, int? Q7, int? Q8,
    int? TotalScore, string? Severity);

public sealed record StopBangData(
    bool? Snoring, bool? Tired, bool? Observed, bool? Pressure,
    bool? BMI_Over35, bool? Age_Over50, bool? Neck_Over40, bool? Male,
    int? TotalScore, string? RiskLevel);

public sealed record CATData(
    int? Q1, int? Q2, int? Q3, int? Q4, int? Q5, int? Q6, int? Q7, int? Q8,
    int? TotalScore, string? ImpactLevel);

public sealed record MMRCData(
    int? Grade, string? Description);
