using System.Net;
using System.Text.Json;
using Microsoft.Data.SqlClient;

namespace SalaCunaPDI.API.Middleware;

/// <summary>
/// Middleware global para manejo estandarizado de excepciones de dominio, SQL Server y respuestas JSON.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excepción capturada en {Path}: {Message}", context.Request.Path, ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var sqlEx = exception as SqlException ?? exception.InnerException as SqlException;
        if (sqlEx != null)
        {
            context.Response.StatusCode = (int)HttpStatusCode.ServiceUnavailable;
            var mensajeSql = sqlEx.Number == 4060
                ? "El usuario 'usr_sala_cuna' no tiene permisos asignados en la base de datos recién recreada 'SalaCunaPDI'. Ejecute en SSMS: USE SalaCunaPDI; CREATE USER [usr_sala_cuna] FOR LOGIN [usr_sala_cuna]; ALTER ROLE [db_owner] ADD MEMBER [usr_sala_cuna];"
                : $"Error de SQL Server (#{sqlEx.Number}): {sqlEx.Message}";

            var sqlPayload = new
            {
                codigoEstado = context.Response.StatusCode,
                mensaje = mensajeSql,
                detalle = sqlEx.Message,
                timestamp = DateTime.Now
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(sqlPayload, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            }));
            return;
        }

        var statusCode = exception switch
        {
            KeyNotFoundException or FileNotFoundException => (int)HttpStatusCode.NotFound,
            ArgumentException or InvalidOperationException => (int)HttpStatusCode.BadRequest,
            UnauthorizedAccessException => (int)HttpStatusCode.Unauthorized,
            _ => (int)HttpStatusCode.InternalServerError
        };

        context.Response.StatusCode = statusCode;

        var payload = new
        {
            codigoEstado = statusCode,
            mensaje = statusCode == (int)HttpStatusCode.InternalServerError
                ? "Ocurrió un error interno en el servidor al procesar la solicitud."
                : exception.Message,
            detalle = exception.InnerException?.Message ?? exception.Message,
            timestamp = DateTime.Now
        };

        var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
