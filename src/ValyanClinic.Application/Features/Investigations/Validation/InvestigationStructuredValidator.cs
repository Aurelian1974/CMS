using System.Text.Json;
using ValyanClinic.Application.Features.Investigations.Payloads;

namespace ValyanClinic.Application.Features.Investigations.Validation;

/// <summary>
/// Validator pentru câmpul <c>StructuredData</c> (JSON) per <c>InvestigationType</c>.
/// Returnează <c>null</c> dacă datele sunt valide sau sare peste validare (tip necunoscut),
/// sau un mesaj de eroare dacă sunt în afara intervalelor fiziologice.
/// </summary>
public static class InvestigationStructuredValidator
{
    public static string? Validate(string investigationType, string structuredJson)
    {
        try
        {
            return investigationType switch
            {
                "Spirometry"        => ValidateSpirometry(structuredJson),
                "DLCO"              => ValidateDLCO(structuredJson),
                "ABG"               => ValidateABG(structuredJson),
                "Oximetry"          => ValidateOximetry(structuredJson),
                "SixMWT"            => ValidateSixMWT(structuredJson),
                "ECG"               => ValidateECG(structuredJson),
                "Echocardiography"  => ValidateEcho(structuredJson),
                "Holter_ECG"        => Deserialize<HolterECGData>(structuredJson),
                "Holter_BP"         => Deserialize<HolterBPData>(structuredJson),
                "StressTest"        => Deserialize<StressTestData>(structuredJson),
                "PSG_Diagnostic"    => Deserialize<PSGDiagnosticData>(structuredJson),
                "PSG_SplitNight"    => Deserialize<PSGSplitNightData>(structuredJson),
                "CPAP_Titration"    => Deserialize<CPAPTitrationData>(structuredJson),
                "CPAP_FollowUp"     => Deserialize<CPAPFollowUpData>(structuredJson),
                "TTGO"              => ValidateTTGO(structuredJson),
                "Epworth"           => ValidateEpworth(structuredJson),
                "STOP_BANG"         => Deserialize<StopBangData>(structuredJson),
                "CAT"               => ValidateCAT(structuredJson),
                "mMRC"              => ValidateMMRC(structuredJson),
                _                   => null,
            };
        }
        catch (JsonException ex)
        {
            return $"StructuredData nu este JSON valid pentru tipul {investigationType}: {ex.Message}";
        }
    }

    private static string? Deserialize<T>(string json)
    {
        var _ = JsonSerializer.Deserialize<T>(json, InvestigationStructuredPayloads.JsonOptions);
        return null;
    }

    private static string? ValidateSpirometry(string json)
    {
        var data = JsonSerializer.Deserialize<SpirometryData>(json, InvestigationStructuredPayloads.JsonOptions);
        if (data is null) return "Spirometry: payload invalid.";
        if (data.FVC is < 0 or > 8) return "FVC trebuie să fie între 0 și 8 L.";
        if (data.FEV1 is < 0 or > 8) return "FEV1 trebuie să fie între 0 și 8 L.";
        if (data.FEV1_FVC_Ratio is < 0 or > 100) return "FEV1/FVC trebuie să fie între 0 și 100%.";
        if (data.PEF is < 0 or > 20) return "PEF trebuie să fie între 0 și 20 L/s.";
        return null;
    }

    private static string? ValidateDLCO(string json)
    {
        var data = JsonSerializer.Deserialize<DLCOData>(json, InvestigationStructuredPayloads.JsonOptions);
        if (data is null) return "DLCO: payload invalid.";
        if (data.DLCO is < 0 or > 60) return "DLCO trebuie să fie între 0 și 60 mL/min/mmHg.";
        return null;
    }

    private static string? ValidateABG(string json)
    {
        var data = JsonSerializer.Deserialize<ABGData>(json, InvestigationStructuredPayloads.JsonOptions);
        if (data is null) return "ABG: payload invalid.";
        if (data.pH is < 6.5m or > 8m) return "pH trebuie să fie între 6.5 și 8.0.";
        if (data.PaO2 is < 0 or > 600) return "PaO2 trebuie să fie între 0 și 600 mmHg.";
        if (data.PaCO2 is < 0 or > 200) return "PaCO2 trebuie să fie între 0 și 200 mmHg.";
        if (data.SaO2 is < 0 or > 100) return "SaO2 trebuie să fie între 0 și 100%.";
        return null;
    }

    private static string? ValidateOximetry(string json)
    {
        var data = JsonSerializer.Deserialize<OximetryData>(json, InvestigationStructuredPayloads.JsonOptions);
        if (data is null) return "Oximetry: payload invalid.";
        if (data.SpO2_Rest is < 0 or > 100) return "SpO2 trebuie să fie între 0 și 100%.";
        if (data.HR_Rest is < 0 or > 250) return "HR trebuie să fie între 0 și 250 bpm.";
        return null;
    }

    private static string? ValidateSixMWT(string json)
    {
        var data = JsonSerializer.Deserialize<SixMWTData>(json, InvestigationStructuredPayloads.JsonOptions);
        if (data is null) return "6MWT: payload invalid.";
        if (data.DistanceMeters is < 0 or > 1500) return "Distanța la 6MWT trebuie să fie între 0 și 1500 m.";
        return null;
    }

    private static string? ValidateECG(string json)
    {
        var data = JsonSerializer.Deserialize<ECGData>(json, InvestigationStructuredPayloads.JsonOptions);
        if (data is null) return "ECG: payload invalid.";
        if (data.HeartRate is < 0 or > 300) return "HR trebuie să fie între 0 și 300 bpm.";
        if (data.QTc_ms is < 0 or > 800) return "QTc trebuie să fie între 0 și 800 ms.";
        return null;
    }

    private static string? ValidateEcho(string json)
    {
        var data = JsonSerializer.Deserialize<EchocardiographyData>(json, InvestigationStructuredPayloads.JsonOptions);
        if (data is null) return "Ecocardiografie: payload invalid.";
        if (data.LVEF is < 0 or > 90) return "LVEF trebuie să fie între 0 și 90%.";
        return null;
    }

    private static string? ValidateTTGO(string json)
    {
        var data = JsonSerializer.Deserialize<TTGOData>(json, InvestigationStructuredPayloads.JsonOptions);
        if (data is null) return "TTGO: payload invalid.";
        if (data.Glucose_0min is < 0 or > 1000) return "Glicemie 0min trebuie să fie între 0 și 1000 mg/dL.";
        return null;
    }

    private static string? ValidateEpworth(string json)
    {
        var data = JsonSerializer.Deserialize<EpworthData>(json, InvestigationStructuredPayloads.JsonOptions);
        if (data is null) return "Epworth: payload invalid.";
        int[] answers = { data.Q1 ?? -1, data.Q2 ?? -1, data.Q3 ?? -1, data.Q4 ?? -1, data.Q5 ?? -1, data.Q6 ?? -1, data.Q7 ?? -1, data.Q8 ?? -1 };
        foreach (var a in answers)
            if (a is < -1 or > 3) return "Răspunsurile Epworth trebuie să fie între 0 și 3.";
        if (data.TotalScore is < 0 or > 24) return "Scor total Epworth trebuie să fie între 0 și 24.";
        return null;
    }

    private static string? ValidateCAT(string json)
    {
        var data = JsonSerializer.Deserialize<CATData>(json, InvestigationStructuredPayloads.JsonOptions);
        if (data is null) return "CAT: payload invalid.";
        int[] answers = { data.Q1 ?? -1, data.Q2 ?? -1, data.Q3 ?? -1, data.Q4 ?? -1, data.Q5 ?? -1, data.Q6 ?? -1, data.Q7 ?? -1, data.Q8 ?? -1 };
        foreach (var a in answers)
            if (a is < -1 or > 5) return "Răspunsurile CAT trebuie să fie între 0 și 5.";
        if (data.TotalScore is < 0 or > 40) return "Scor CAT trebuie să fie între 0 și 40.";
        return null;
    }

    private static string? ValidateMMRC(string json)
    {
        var data = JsonSerializer.Deserialize<MMRCData>(json, InvestigationStructuredPayloads.JsonOptions);
        if (data is null) return "mMRC: payload invalid.";
        if (data.Grade is < 0 or > 4) return "Gradul mMRC trebuie să fie între 0 și 4.";
        return null;
    }
}
