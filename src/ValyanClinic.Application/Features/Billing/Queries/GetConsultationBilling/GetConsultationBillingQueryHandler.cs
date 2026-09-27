using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Billing.DTOs;

namespace ValyanClinic.Application.Features.Billing.Queries.GetConsultationBilling;

public sealed class GetConsultationBillingQueryHandler(
    IBillingRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetConsultationBillingQuery, Result<ConsultationBillingDto>>
{
    public async Task<Result<ConsultationBillingDto>> Handle(
        GetConsultationBillingQuery request, CancellationToken cancellationToken)
    {
        var billing = await repository.GetSummaryAsync(request.ConsultationId, currentUser.ClinicId, cancellationToken);
        if (billing is null)
            return Result<ConsultationBillingDto>.NotFound(ErrorMessages.Consultation.NotFound);

        var isBillable = billing.StatusCode is ConsultationStatusCodes.Completed or ConsultationStatusCodes.Billed;
        var hasActiveInvoice = billing.Invoices.Any(i => !i.IsStorno && i.StatusCode == InvoiceStatusCodes.Issued);

        // Aceleași reguli ca în SP-uri; aici doar pentru a ghida UI-ul
        return Result<ConsultationBillingDto>.Success(billing with
        {
            CanEditServices = billing.StatusCode is ConsultationStatusCodes.InProgress or ConsultationStatusCodes.Completed,
            CanCollect      = isBillable && billing.Total > 0 && billing.Balance > 0,
            CanInvoice      = isBillable && billing.Total > 0 && !hasActiveInvoice,
        });
    }
}
