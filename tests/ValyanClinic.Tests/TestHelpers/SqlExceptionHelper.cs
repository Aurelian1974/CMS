using System.Reflection;
using Microsoft.Data.SqlClient;

namespace ValyanClinic.Tests.TestHelpers;

/// <summary>
/// Fabrică de SqlException pentru teste unitare.
/// SqlException nu poate fi instanțiată direct (constructor intern), deci folosim reflection.
/// </summary>
internal static class SqlExceptionHelper
{
    internal static SqlException Make(int number)
    {
        var assembly           = typeof(SqlException).Assembly;
        var errorCollectionType = assembly.GetType("Microsoft.Data.SqlClient.SqlErrorCollection")!;
        var errorType           = assembly.GetType("Microsoft.Data.SqlClient.SqlError")!;

        var collection = Activator.CreateInstance(errorCollectionType, nonPublic: true)!;

        // Alegem primul constructor intern al SqlError și completăm parametrii generic
        var ctor = errorType
            .GetConstructors(BindingFlags.NonPublic | BindingFlags.Instance)
            .OrderByDescending(c => c.GetParameters().Length)
            .First();

        var args = ctor.GetParameters().Select((p, i) => i switch
        {
            0 => (object)number,        // infoNumber
            _ => p.ParameterType switch
            {
                Type t when t == typeof(byte)   => (object)(byte)0,
                Type t when t == typeof(uint)   => (object)(uint)0,
                Type t when t == typeof(int)    => (object)0,
                Type t when t == typeof(string) => (object)"test",
                _                               => (object?)null
            }
        }).ToArray();

        var error = ctor.Invoke(args);

        errorCollectionType
            .GetMethod("Add", BindingFlags.NonPublic | BindingFlags.Instance)!
            .Invoke(collection, [error]);

        return (SqlException)typeof(SqlException)
            .GetMethod(
                "CreateException",
                BindingFlags.NonPublic | BindingFlags.Static,
                [errorCollectionType, typeof(string)])!
            .Invoke(null, [collection, "11.0.0"])!;
    }
}
