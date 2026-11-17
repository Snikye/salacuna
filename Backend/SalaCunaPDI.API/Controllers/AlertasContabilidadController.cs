using Microsoft.AspNetCore.Mvc;
using SalaCunaPDI.API.Models.DTOs;
using SalaCunaPDI.API.Services.Interfaces;

namespace SalaCunaPDI.API.Controllers;

[ApiController]
[Route("api/alertas")]
public class AlertasContabilidadController : ControllerBase
{
    private readonly IAlertaContabilidadService _alertaService;

    public AlertasContabilidadController(IAlertaContabilidadService alertaService)
    {
        _alertaService = alertaService;
    }

    /// <summary>
    /// Lista las alertas generadas en el sistema, con filtro opcional por estado ('Enviada', 'Revisada').
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<HistorialAlertaDto>>> ListarAlertas([FromQuery] string? estadoAlerta = null)
    {
        var alertas = await _alertaService.ListarAlertasAsync(estadoAlerta);
        return Ok(alertas);
    }

    /// <summary>
    /// Ejecuta un barrido sobre los expedientes pendientes y genera alertas.
    /// </summary>
    [HttpPost("generar-pendientes")]
    public async Task<ActionResult<List<HistorialAlertaDto>>> GenerarAlertasPendientes()
    {
        var responsable = Request.Headers["X-Usuario-Responsable"].FirstOrDefault();
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var alertas = await _alertaService.GenerarAlertasPendientesAsync(responsable, ip);
        return Ok(alertas);
    }

    /// <summary>
    /// Marca una alerta como 'Revisada'.
    /// </summary>
    [HttpPut("{alertaId:int}/revisar")]
    public async Task<ActionResult<HistorialAlertaDto>> MarcarAlertaRevisada(
        int alertaId,
        [FromBody] RevisarAlertaRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UsuarioResponsable))
        {
            request.UsuarioResponsable = Request.Headers["X-Usuario-Responsable"].FirstOrDefault();
        }

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var actualizada = await _alertaService.MarcarAlertaRevisadaAsync(alertaId, request, ip);
        return Ok(actualizada);
    }

    /// <summary>
    /// MÓDULO 4: Obtiene la distribución presupuestaria anual regional (60% RM / 40% 15 Regiones) y saldos disponibles.
    /// </summary>
    [HttpGet("~/api/presupuesto-regional/{anio:int}")]
    public async Task<ActionResult<ResumenPresupuestoAnualDto>> ObtenerPresupuestoRegional(int anio)
    {
        var resumen = await _alertaService.ObtenerPresupuestoAnualRegionalAsync(anio);
        return Ok(resumen);
    }

    /// <summary>
    /// MÓDULO 4: Inicializa o actualiza la bolsa presupuestaria anual global aplicando la regla 60% RM / 40% Regiones.
    /// </summary>
    [HttpPost("~/api/presupuesto-regional/inicializar")]
    public async Task<ActionResult<ResumenPresupuestoAnualDto>> InicializarPresupuestoRegional(
        [FromBody] InicializarPresupuestoAnualRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UsuarioResponsable))
        {
            request.UsuarioResponsable = Request.Headers["X-Usuario-Responsable"].FirstOrDefault();
        }

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var resumen = await _alertaService.InicializarPresupuestoAnualRegionalAsync(request, ip);
        return Ok(resumen);
    }
}
