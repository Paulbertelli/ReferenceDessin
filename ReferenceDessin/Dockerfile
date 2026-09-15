# syntax=docker/dockerfile:1

FROM node:24-alpine AS construction-frontend

WORKDIR /src/frontend

COPY Front/reference-dessin-web/package.json ./
COPY Front/reference-dessin-web/package-lock.json ./

RUN npm ci

COPY Front/reference-dessin-web/ ./

RUN npm run build


FROM mcr.microsoft.com/dotnet/sdk:10.0 AS construction-backend

WORKDIR /src/backend

COPY Back/ReferenceDessin/ ./

RUN dotnet restore \
    src/ReferenceDessin.Api/ReferenceDessin.Api.csproj

RUN dotnet publish \
    src/ReferenceDessin.Api/ReferenceDessin.Api.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore


FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS execution

WORKDIR /app

ENV ASPNETCORE_HTTP_PORTS=8080

EXPOSE 8080

COPY --from=construction-backend /app/publish ./

COPY --from=construction-frontend \
    /src/frontend/dist/reference-dessin-web/browser \
    ./wwwroot

RUN chmod -R a+rX /app/wwwroot

USER $APP_UID

ENTRYPOINT ["dotnet", "ReferenceDessin.Api.dll"]
