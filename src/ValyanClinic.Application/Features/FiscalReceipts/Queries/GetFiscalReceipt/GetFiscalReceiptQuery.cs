using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.FiscalReceipts.DTOs;

namespace ValyanClinic.Application.Features.FiscalReceipts.Queries.GetFiscalReceipt;

public sealed record GetFiscalReceiptQuery(Guid Id) : IRequest<Result<FiscalReceiptDetailDto>>;
