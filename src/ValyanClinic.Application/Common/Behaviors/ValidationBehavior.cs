using System.Collections.Concurrent;
using System.Linq.Expressions;
using FluentValidation;
using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Common.Behaviors;

public sealed class ValidationBehavior<TRequest, TResponse>(
    IEnumerable<IValidator<TRequest>> validators)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    // Delegate-uri pre-compilate per tip Result<T> — evită reflection la fiecare request.
    // Populated lazily la primul apel pentru fiecare TResponse;
    // ulterior apelurile folosesc delegate-ul cacheuit.
    private static readonly ConcurrentDictionary<Type, Func<string, int, TResponse>?> _factories = new();

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!validators.Any())
            return await next(cancellationToken);

        var context = new ValidationContext<TRequest>(request);

        var failures = (await Task.WhenAll(
                validators.Select(v => v.ValidateAsync(context, cancellationToken))))
            .SelectMany(r => r.Errors)
            .Where(f => f is not null)
            .ToList();

        if (failures.Count == 0)
            return await next(cancellationToken);

        var errors = string.Join(" | ", failures.Select(f => f.ErrorMessage));

        var factory = _factories.GetOrAdd(typeof(TResponse), BuildFactory);
        if (factory is not null)
            return factory(errors, 400);

        throw new ValidationException(failures);
    }

    /// <summary>
    /// Construiește un delegate compilat pentru <c>Result&lt;T&gt;.Failure(string, int)</c>.
    /// Compilarea are loc o singură dată per tip; apelurile ulterioare folosesc delegate-ul cacheuit.
    /// Returnează <c>null</c> dacă TResponse nu este <c>Result&lt;T&gt;</c>.
    /// </summary>
    private static Func<string, int, TResponse>? BuildFactory(Type responseType)
    {
        if (!responseType.IsGenericType ||
            responseType.GetGenericTypeDefinition() != typeof(Result<>))
            return null;

        var method = responseType.GetMethod("Failure", [typeof(string), typeof(int)]);
        if (method is null) return null;

        var errorParam = Expression.Parameter(typeof(string), "error");
        var codeParam  = Expression.Parameter(typeof(int),    "code");
        var call       = Expression.Call(method, errorParam, codeParam);

        return Expression.Lambda<Func<string, int, TResponse>>(call, errorParam, codeParam)
                         .Compile();
    }
}
