using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.FiscalReceipts.DTOs;

namespace ValyanClinic.Application.Features.FiscalReceipts.Queries.GetFiscalReceipt;

public sealed class GetFiscalReceiptQueryHandler(
    IFiscalReceiptRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetFiscalReceiptQuery, Result<FiscalReceiptDetailDto>>
{
    public async Task<Result<FiscalReceiptDetailDto>> Handle(GetFiscalReceiptQuery request, CancellationToken cancellationToken)
    {
        var receipt = await repository.GetByIdAsync(request.Id, currentUser.ClinicId, cancellationToken);
        return receipt is null
            ? Result<FiscalReceiptDetailDto>.NotFound(ErrorMessages.Billing.FiscalReceiptNotFound)
            : Result<FiscalReceiptDetailDto>.Success(receipt);
    }
}
