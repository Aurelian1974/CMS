using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Consultations.DTOs;

namespace ValyanClinic.Application.Features.Consultations.Queries.GetConsultationById;

public sealed class GetConsultationByIdQueryHandler(
    IConsultationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetConsultationByIdQuery, Result<ConsultationDetailDto>>
{
    public async Task<Result<ConsultationDetailDto>> Handle(
        GetConsultationByIdQuery request, CancellationToken cancellationToken)
    {
        var consultation = await repository.GetByIdAsync(
            request.Id, currentUser.ClinicId, cancellationToken);

        return consultation is null
            ? Result<ConsultationDetailDto>.NotFound(ErrorMessages.Consultation.NotFound)
            : Result<ConsultationDetailDto>.Success(consultation);
    }
}
