using ValyanClinic.Application.Features.FinancialSettings.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Emite tichete semnate (ECDSA P-256) cu care fiscal bridge-ul local acceptă asocierea unei stații.
/// Bridge-ul verifică semnătura cu cheia publică din configurarea lui.
/// </summary>
public interface IBridgePairingTicketIssuer
{
    bool IsConfigured { get; }

    /// <summary>Cheia publică (PEM, SubjectPublicKeyInfo) de pus în Bridge:PairingPublicKey.</summary>
    string GetPublicKeyPem();

    BridgePairingTicketDto Issue(Guid clinicId, Guid userId);
}
