FROM mcr.microsoft.com/dotnet/sdk:10.0.402 AS build
WORKDIR /src

COPY global.json Catalog.sln ./
COPY Catalog.Api/Catalog.Api.csproj Catalog.Api/packages.lock.json Catalog.Api/
COPY Catalog.Application/Catalog.Application.csproj Catalog.Application/packages.lock.json Catalog.Application/
COPY Catalog.Domain/Catalog.Domain.csproj Catalog.Domain/packages.lock.json Catalog.Domain/
COPY Catalog.Infrastructure/Catalog.Infrastructure.csproj Catalog.Infrastructure/packages.lock.json Catalog.Infrastructure/
COPY Catalog.Tests.Unit/Catalog.Tests.Unit.csproj Catalog.Tests.Unit/packages.lock.json Catalog.Tests.Unit/
RUN dotnet restore Catalog.sln --locked-mode

COPY . .
RUN dotnet publish Catalog.Api/Catalog.Api.csproj --configuration Release --no-restore --output /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0.13 AS runtime
WORKDIR /app
COPY --from=build --chown=app:app /app/publish ./
USER app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
CMD ["dotnet", "Catalog.Api.dll"]
