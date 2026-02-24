using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Departments.DTOs;

namespace ValyanClinic.Application.Features.Departments.Queries.GetDepartmentById;

public sealed class GetDepartmentByIdQueryHandler(
    IDepartmentRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetDepartmentByIdQuery, Result<DepartmentDto>>
{
    public async Task<Result<DepartmentDto>> Handle(
        GetDepartmentByIdQuery request, CancellationToken cancellationToken)
    {
        var department = await repository.GetByIdAsync(
            request.Id,
            currentUser.ClinicId,
            cancellationToken);

        return department is not null
            ? Result<DepartmentDto>.Success(department)
            : Result<DepartmentDto>.NotFound(ErrorMessages.Department.NotFound);
    }
}
