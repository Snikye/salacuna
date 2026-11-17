using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using SalaCunaPDI.API.Data;
using SalaCunaPDI.API.Middleware;
using SalaCunaPDI.API.Models.Entities;
using SalaCunaPDI.API.Services.Implementations;
using SalaCunaPDI.API.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// Configurar escucha explícita en todas las interfaces en el puerto 5228 (incluyendo 10.33.34.3 y localhost)
builder.WebHost.UseUrls("http://0.0.0.0:5228");

// 1. Configuración de Base de Datos SQL Server (Database First / Mapeo Directo)
var connectionString = builder.Configuration.GetConnectionString("SalaCunaConnection")
    ?? throw new InvalidOperationException("No se encontró la cadena de conexión 'SalaCunaConnection' en appsettings.json.");

builder.Services.AddDbContext<SalaCunaDbContext>(options =>
    options.UseSqlServer(connectionString));

// 2. Registro de Servicios de Dominio e Inyección de Dependencias
builder.Services.AddScoped<IAuditoriaService, AuditoriaService>();
builder.Services.AddScoped<IUsuarioSistemaService, UsuarioSistemaService>();
builder.Services.AddScoped<IFuncionarioService, FuncionarioService>();
builder.Services.AddScoped<ISolicitudService, SolicitudService>();
builder.Services.AddScoped<IDocumentoInicialService, DocumentoInicialService>();
builder.Services.AddScoped<IControlMensualService, ControlMensualService>();
builder.Services.AddScoped<IAlertaContabilidadService, AlertaContabilidadService>();

// 3. Configuración de Controladores y Serialización JSON
builder.Services.AddControllers();

// 4. Configuración de Políticas de CORS Seguras (permitiendo localhost:4223 y 10.33.34.3:4223)
const string AngularCorsPolicy = "AngularSpaCorsPolicy";
var allowedOrigins = builder.Configuration.GetSection("CorsSettings:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:4223", "http://10.33.34.3:4223" };

builder.Services.AddCors(options =>
{
    options.AddPolicy(AngularCorsPolicy, policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
              .AllowAnyHeader()
              .WithExposedHeaders("Content-Disposition")
              .AllowCredentials();
    });
});

// 5. Documentación OpenAPI / Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Sistema de Gestión Documental y Workflow por Roles - Sala Cuna PDI API",
        Version = "v2",
        Description = "API RESTful para el flujo operativo de Sala Cuna PDI: Coordinador (Carpeta de Vida) -> Visador -> Logística -> Contabilidad y Administración."
    });

    var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

var app = builder.Build();

// Verificación inicial de conexión y usuarios base en SQL Server (Database First)
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<SalaCunaDbContext>();

        if (!dbContext.UsuariosSistema.Any(u => u.Rut == "18441463-5"))
        {
            dbContext.UsuariosSistema.Add(new UsuarioSistema
            {
                Rut = "18441463-5",
                Nombres = "Administrador",
                Apellidos = "General PDI",
                Rol = "Administrador",
                CorreoElectronico = "admin.salacuna@investigaciones.cl",
                PasswordHash = "123456",
                Activo = true,
                FechaCreacion = DateTime.Now
            });
            dbContext.SaveChanges();
        }

        logger.LogInformation("Conexión con SQL Server (SalaCunaPDI en SRVCHUCKNORRIS) verificada exitosamente.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Advertencia al verificar datos iniciales en SQL Server: {Mensaje}", ex.Message);
    }
}

// 6. Pipeline de Middleware HTTP
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Sala Cuna PDI API v2");
    c.RoutePrefix = "swagger";
});

app.UseCors(AngularCorsPolicy);

app.UseAuthorization();

app.MapControllers();

app.Run();
