# Use the official .NET SDK image for building
FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /app

# Copy the .csproj file and restore dependencies
COPY ["CallApp/CallApp.csproj", "CallApp/"]
RUN dotnet restore "CallApp/CallApp.csproj"

# Copy the rest of the app and build
COPY . .
RUN dotnet build "CallApp/CallApp.csproj" -c Release -o /app/build

# Publish the app
RUN dotnet publish "CallApp/CallApp.csproj" -c Release -o /app/publish

# Final stage: Run the app
FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "CallApp.dll"]
