using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.FinancialSettings.DTOs;

namespace ValyanClinic.Application.Features.FinancialSettings.Queries.GetInvoiceSeries;

public sealed class GetInvoiceSeriesQueryHandler(
    IFinancialSettingsRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetInvoiceSeriesQuery, Result<IReadOnlyList<InvoiceSeriesDto>>>
{
    public async Task<Result<IReadOnlyList<InvoiceSeriesDto>>> Handle(
        GetInvoiceSeriesQuery request, CancellationToken cancellationToken)
        => Result<IReadOnlyList<InvoiceSeriesDto>>.Success(
            await repository.GetInvoiceSeriesAsync(currentUser.ClinicId, cancellationToken));
}
