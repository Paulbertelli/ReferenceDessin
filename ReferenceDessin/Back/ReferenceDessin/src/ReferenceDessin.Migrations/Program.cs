using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ReferenceDessin.Infrastructure;

var configuration = new ConfigurationBuilder().AddEnvironmentVariables().Build();

var services = new ServiceCollection();

services.AddInfrastructure(configuration);

await using var provider = services.BuildServiceProvider();

await using var scope = provider.CreateAsyncScope();

var database = scope.ServiceProvider.GetRequiredService<ReferenceDessin.Infrastructure.Persistence.ReferenceDessinDbContext>();

await database.Database.MigrateAsync();

Console.WriteLine("Migrations EF Core appliquées.");
