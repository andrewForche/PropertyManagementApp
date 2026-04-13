using Property_Management_Api.Configuration;
using Property_Management_Api.DataServices;
using Property_Management_Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

builder.Services.Configure<ApiSettings>(
    builder.Configuration.GetSection(ApiSettings.SectionName));

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
builder.Services.AddScoped<IRentCollectionDataService, RentCollectionDataService>();
builder.Services.AddScoped<IRentCollectionService, RentCollectionService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("FrontendClient");
app.MapControllers();

app.Run();
