using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Queries.GetSpecialtyTree;

public sealed class GetSpecialtyTreeQueryHandler(ISpecialtyRepository repository)
    : IRequestHandler<GetSpecialtyTreeQuery, Result<IEnumerable<SpecialtyTreeNodeDto>>>
{
    public async Task<Result<IEnumerable<SpecialtyTreeNodeDto>>> Handle(
        GetSpecialtyTreeQuery request, CancellationToken cancellationToken)
    {
        var result = await repository.GetTreeAsync(request.IsActive, cancellationToken);

        // Construim arborele: categorii → specialități → subspecialități
        var categories = result.Categories.ToList();
        var specialties = result.Specialties.ToList();
        var subspecialties = result.Subspecialties.ToList();

        // Atașăm subspecialitățile la specialitățile lor
        foreach (var spec in specialties)
        {
            spec.Children = subspecialties
                .Where(sub => sub.ParentId == spec.Id)
                .ToList();
        }

        // Atașăm specialitățile la categorii
        foreach (var cat in categories)
        {
            cat.Children = specialties
                .Where(s => s.ParentId == cat.Id)
                .ToList();
        }

        return Result<IEnumerable<SpecialtyTreeNodeDto>>.Success(categories);
    }
}
