using ValyanClinic.Application.Features.Prescriptions.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>Generează documentul PDF al rețetei (macheta diferă: compensată vs simplă).</summary>
public interface IPrescriptionPdfGenerator
{
    byte[] Generate(PrescriptionDetailDto prescription);
}
