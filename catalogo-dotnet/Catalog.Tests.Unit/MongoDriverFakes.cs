using Catalog.Infrastructure.Products;
using Moq;
using MongoDB.Bson;
using MongoDB.Driver;

namespace Catalog.Tests.Unit;

internal sealed class FakeMongoDriver
{
    private FakeMongoDriver(IReadOnlyList<ProductDocument> documents, long totalDocuments)
    {
        Documents = documents;
        TotalDocuments = totalDocuments;

        Cursor = new Mock<IAsyncCursor<ProductDocument>>();
        Cursor.SetupGet(cursor => cursor.Current).Returns(documents);
        Cursor.SetupSequence(cursor => cursor.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(documents.Count > 0)
            .ReturnsAsync(false);
        Cursor.SetupSequence(cursor => cursor.MoveNext(It.IsAny<CancellationToken>()))
            .Returns(documents.Count > 0)
            .Returns(false);

        Collection = new Mock<IMongoCollection<ProductDocument>>();
        Collection.Setup(collection => collection.CountDocumentsAsync(
                It.IsAny<FilterDefinition<ProductDocument>>(),
                It.IsAny<CountOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(totalDocuments);
        Collection.Setup(collection => collection.FindAsync(
                It.IsAny<FilterDefinition<ProductDocument>>(),
                It.IsAny<FindOptions<ProductDocument, ProductDocument>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Cursor.Object);

        Database = new Mock<IMongoDatabase>();
        Database.Setup(database => database.GetCollection<ProductDocument>(
                "products",
                It.IsAny<MongoCollectionSettings>()))
            .Returns(Collection.Object);
        Database.Setup(database => database.RunCommandAsync(
                It.IsAny<Command<BsonDocument>>(),
                It.IsAny<ReadPreference>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new BsonDocument("ok", 1));
    }

    public IReadOnlyList<ProductDocument> Documents { get; }
    public long TotalDocuments { get; }
    public Mock<IAsyncCursor<ProductDocument>> Cursor { get; }
    public Mock<IMongoCollection<ProductDocument>> Collection { get; }
    public Mock<IMongoDatabase> Database { get; }
    public int CountCalls => Collection.Invocations.Count(invocation => invocation.Method.Name == "CountDocumentsAsync");
    public int FindCalls => Collection.Invocations.Count(invocation => invocation.Method.Name == "FindAsync");
    public int PingCalls => Database.Invocations.Count(invocation => invocation.Method.Name == "RunCommandAsync");
    public object? LastFindOptions => Collection.Invocations
        .LastOrDefault(invocation => invocation.Method.Name == "FindAsync")?.Arguments[1];
    public CancellationToken LastFindCancellationToken => Collection.Invocations
        .Last(invocation => invocation.Method.Name == "FindAsync").Arguments[^1] is CancellationToken token
            ? token
            : CancellationToken.None;
    public CancellationToken LastCountCancellationToken => Collection.Invocations
        .Last(invocation => invocation.Method.Name == "CountDocumentsAsync").Arguments[^1] is CancellationToken token
            ? token
            : CancellationToken.None;
    public CancellationToken LastPingCancellationToken => Database.Invocations
        .Last(invocation => invocation.Method.Name == "RunCommandAsync").Arguments[^1] is CancellationToken token
            ? token
            : CancellationToken.None;

    public void FailFind(Exception exception)
    {
        Collection.Setup(collection => collection.FindAsync(
                It.IsAny<FilterDefinition<ProductDocument>>(),
                It.IsAny<FindOptions<ProductDocument, ProductDocument>>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(exception);
    }

    public void FailPing(Exception exception)
    {
        Database.Setup(database => database.RunCommandAsync(
                It.IsAny<Command<BsonDocument>>(),
                It.IsAny<ReadPreference>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(exception);
    }

    public static FakeMongoDriver Create(IReadOnlyList<ProductDocument> documents, long totalDocuments = 0) =>
        new(documents, totalDocuments);
}
