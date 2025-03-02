# Use official .NET SDK image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy .csproj and restore dependencies
COPY ["CallApp/CallApp.csproj", "CallApp/"]
RUN dotnet restore "CallApp/CallApp.csproj"

# Copy the rest of the app and build
COPY . .
WORKDIR "/src/CallApp"
RUN dotnet build "CallApp.csproj" -c Release -o /app/build

# Publish Stage
FROM build AS publish
RUN dotnet publish "CallApp.csproj" -c Release -o /app/publish

# Final Stage
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "CallApp.dll"]