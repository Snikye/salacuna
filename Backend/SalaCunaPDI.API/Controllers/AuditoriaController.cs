using Microsoft.AspNetCore.Mvc;
using SalaCunaPDI.API.Models.DTOs;
using SalaCunaPDI.API.Services.Interfaces;

namespace SalaCunaPDI.API.Controllers;

[ApiController]
[Route("api/auditoria")]
public class AuditoriaController : ControllerBase
{
    private readonly IAuditoriaService _auditoriaService;

    public AuditoriaController(IAuditoriaService auditoriaService)
    {
        _auditoriaService = auditoriaService;
    }

    /// <summary>
    /// Consulta el historial de auditoría del sistema con filtros opcionales.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<AuditoriaSistemaDto>>> Listar(
        [FromQuery] string? tablaAfectada = null,
        [FromQuery] string? accion = null,
        [FromQuery] string? usuarioResponsable = null,
        [FromQuery] int limite = 200)
    {
        var registros = await _auditoriaService.ListarAuditoriaAsync(
            tablaAfectada, accion, usuarioResponsable, limite);
        return Ok(registros);
    }
}
