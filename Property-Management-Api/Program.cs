using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Logging;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Property_Management_Api.Auth;
using Property_Management_Api.Configuration;
using Property_Management_Api.DataServices;
using Property_Management_Api.Services;

var builder = WebApplication.CreateBuilder(args);
IdentityModelEventSource.ShowPII = true;

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Property Management API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your JWT token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});
builder.Services.AddOpenApi();

builder.Services.Configure<ApiSettings>(
    builder.Configuration.GetSection(ApiSettings.SectionName));
builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection(ApiSettings.JwtSectionName));

var jwtSection = builder.Configuration.GetRequiredSection(ApiSettings.JwtSectionName);
var jwtSettings = jwtSection
    .Get<JwtSettings>() ?? new JwtSettings();

if (string.IsNullOrWhiteSpace(jwtSettings.SigningKey) || jwtSettings.SigningKey.Length < 32)
{
    throw new InvalidOperationException(
        "Jwt:SigningKey must be configured and at least 32 characters long.");
}

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SigningKey));

builder.Logging.AddConsole();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = false;
        options.IncludeErrorDetails = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtSettings.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
            NameClaimType = ClaimTypes.NameIdentifier,
            RoleClaimType = ClaimTypes.Role
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("JwtBearer");
                var authorizationHeader = context.Request.Headers.Authorization.ToString();
                var extractedToken = authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                    ? authorizationHeader["Bearer ".Length..].Trim()
                    : authorizationHeader.Trim();
                var normalizedToken = string.IsNullOrWhiteSpace(extractedToken)
                    ? string.Empty
                    : extractedToken.Trim().Trim('"');

                context.Token = string.IsNullOrWhiteSpace(normalizedToken) ? null : normalizedToken;

                logger.LogInformation(
                    "JWT message received. Path={Path}, RawAuthorizationHeader={RawAuthorizationHeader}, ExtractedToken={ExtractedToken}, ContextToken={ContextToken}",
                    context.Request.Path,
                    authorizationHeader,
                    extractedToken,
                    context.Token ?? string.Empty);

                return Task.CompletedTask;
            },
            OnAuthenticationFailed = context =>
            {
                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("JwtBearer");
                logger.LogError(
                    context.Exception,
                    "JWT auth failed. Path={Path}, Exception={Exception}",
                    context.Request.Path,
                    context.Exception);
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("JwtBearer");
                var principal = context.Principal;
                logger.LogInformation(
                    "JWT token validated. Path={Path}, NameIdentifier={NameIdentifier}, Email={Email}, Role={Role}, TenantId={TenantId}",
                    context.Request.Path,
                    principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value,
                    principal?.FindFirst(ClaimTypes.Email)?.Value,
                    principal?.FindFirst(ClaimTypes.Role)?.Value,
                    principal?.FindFirst(CustomClaimTypes.TenantId)?.Value);
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("JwtBearer");
                logger.LogWarning(
                    "JWT challenge triggered. Path={Path}, Error={Error}, ErrorDescription={ErrorDescription}",
                    context.Request.Path,
                    context.Error,
                    context.ErrorDescription);
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendClient", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddScoped<IPropertyDataService, PropertyDataService>();
builder.Services.AddScoped<IPropertyService, PropertyService>();
builder.Services.AddScoped<ITenantDataService, TenantDataService>();
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IAuthDataService, AuthDataService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
builder.Services.AddScoped<IDatabaseInitializationService, DatabaseInitializationService>();
builder.Services.AddScoped<IInvoiceDataService, InvoiceDataService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IMaintenanceDataService, MaintenanceDataService>();
builder.Services.AddScoped<IMaintenanceService, MaintenanceService>();
builder.Services.AddScoped<IRentCollectionDataService, RentCollectionDataService>();
builder.Services.AddScoped<IRentCollectionService, RentCollectionService>();
builder.Services.AddScoped<ISharedDocumentDataService, SharedDocumentDataService>();

builder.Services.Configure<FileStorageOptions>(
    builder.Configuration.GetSection("FileStorage"));

var app = builder.Build();

var startupLogger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("JwtStartup");
var runtimeJwtSettings = app.Services.GetRequiredService<IOptions<JwtSettings>>().Value;
startupLogger.LogInformation(
    "Program JWT settings loaded. Section={Section}, Environment={Environment}, Issuer={Issuer}, Audience={Audience}, SigningKey={SigningKey}, SigningKeyLength={SigningKeyLength}, AccessTokenExpirationMinutes={AccessTokenExpirationMinutes}",
    ApiSettings.JwtSectionName,
    app.Environment.EnvironmentName,
    runtimeJwtSettings.Issuer,
    runtimeJwtSettings.Audience,
    runtimeJwtSettings.SigningKey,
    runtimeJwtSettings.SigningKey.Length,
    runtimeJwtSettings.AccessTokenExpirationMinutes);

startupLogger.LogInformation(
    "Program JWT raw configuration values. Jwt:Issuer={Issuer}, Jwt:Audience={Audience}, Jwt:SigningKey={SigningKey}, Jwt:AccessTokenExpirationMinutes={AccessTokenExpirationMinutes}",
    builder.Configuration["Jwt:Issuer"],
    builder.Configuration["Jwt:Audience"],
    builder.Configuration["Jwt:SigningKey"],
    builder.Configuration["Jwt:AccessTokenExpirationMinutes"]);

await using (var scope = app.Services.CreateAsyncScope())
{
    var databaseInitializationService = scope.ServiceProvider
        .GetRequiredService<IDatabaseInitializationService>();
    await databaseInitializationService.InitializeAsync(CancellationToken.None);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("FrontendClient");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
