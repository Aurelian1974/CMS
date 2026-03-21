namespace ValyanClinic.IntegrationTests.Fixtures;

/// <summary>
/// Colecție xUnit care partajează <see cref="IntegrationTestFixture"/> între toate clasele de test.
/// Un singur container DI + o singură conexiune DB per run.
/// </summary>
[CollectionDefinition(Name)]
public sealed class DatabaseCollection : ICollectionFixture<IntegrationTestFixture>
{
    public const string Name = "Database";
}
