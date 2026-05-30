namespace ValyanClinic.Application.Features.Clinics.DTOs;

/// <summary>DTO pentru un cod CAEN asociat clinicii (din tabelul ClinicCaenCodes).</summary>
public sealed class ClinicCaenCodeDto
{
    /// <summary>Id-ul înregistrării din ClinicCaenCodes (junction table).</summary>
    public Guid Id { get; set; }

    /// <summary>Id-ul codului CAEN din nomenclatorul CaenCodes.</summary>
    public Guid CaenCodeId { get; set; }

    /// <summary>Codul CAEN (ex: "8621").</summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>Denumirea activității CAEN.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Nivelul ierarhic: 1=Secțiune, 2=Diviziune, 3=Grupă, 4=Clasă.</summary>
    public byte Level { get; set; }

    /// <summary>Indică dacă acesta este codul CAEN principal al clinicii.</summary>
    public bool IsPrimary { get; set; }
}
