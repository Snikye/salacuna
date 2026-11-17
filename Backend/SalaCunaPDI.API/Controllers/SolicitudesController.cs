using Microsoft.AspNetCore.Mvc;
using SalaCunaPDI.API.Models.DTOs;
using SalaCunaPDI.API.Services.Interfaces;

namespace SalaCunaPDI.API.Controllers;

[ApiController]
[Route("api/solicitudes")]
public class SolicitudesController : ControllerBase
{
    private readonly ISolicitudService _solicitudService;

    public SolicitudesController(ISolicitudService solicitudService)
    {
        _solicitudService = solicitudService;
    }

    /// <summary>
    /// Lista todas las postulaciones (Etapa 1), con opción de filtrar por estado o pertenencia a la Lista de Pago Activa.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<SolicitudDto>>> Listar(
        [FromQuery] string? estado = null,
        [FromQuery] bool? enListaPagoActiva = null,
        [FromQuery] string? codigoRegion = null)
    {
        var solicitudes = await _solicitudService.ListarSolicitudesAsync(estado, enListaPagoActiva, codigoRegion);
        return Ok(solicitudes);
    }

    /// <summary>
    /// Lista las postulaciones pendientes de ingreso a la Lista de Pago Activa.
    /// </summary>
    [HttpGet("pendientes")]
    public async Task<ActionResult<List<SolicitudDto>>> ListarPendientes([FromQuery] string? codigoRegion = null)
    {
        var pendientes = await _solicitudService.ListarPendientesAsync(codigoRegion);
        return Ok(pendientes);
    }

    /// <summary>
    /// Lista las postulaciones que ya cuentan con Número de Resolución y están en la Lista de Pago Activa.
    /// </summary>
    [HttpGet("lista-pago-activa")]
    public async Task<ActionResult<List<SolicitudDto>>> ListarEnListaPagoActiva([FromQuery] string? codigoRegion = null)
    {
        var activas = await _solicitudService.ListarSolicitudesAsync(enListaPagoActiva: true, codigoRegion: codigoRegion);
        return Ok(activas);
    }

    /// <summary>
    /// Obtiene las solicitudes asociadas a un funcionario específico.
    /// </summary>
    [HttpGet("funcionario/{funcionarioId:int}")]
    public async Task<ActionResult<List<SolicitudDto>>> ListarPorFuncionario(int funcionarioId)
    {
        var solicitudes = await _solicitudService.ListarPorFuncionarioAsync(funcionarioId);
        return Ok(solicitudes);
    }

    /// <summary>
    /// Obtiene el detalle de una postulación por su ID, incluyendo su Resolución y documentos PDF.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<SolicitudDto>> ObtenerPorId(int id)
    {
        var solicitud = await _solicitudService.ObtenerPorIdAsync(id);
        if (solicitud == null)
        {
            return NotFound(new { mensaje = $"No se encontró la solicitud con ID {id}." });
        }

        return Ok(solicitud);
    }

    /// <summary>
    /// Etapa 1.1: Crea una nueva postulación al Bono Compensatorio de Sala Cuna.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<SolicitudDto>> Crear([FromBody] CrearSolicitudRequest request)
    {
        var usuarioHeader = Request.Headers["X-Usuario-Responsable"].FirstOrDefault();
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var creada = await _solicitudService.CrearSolicitudAsync(request, usuarioHeader, ip);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = creada.SolicitudID }, creada);
    }

    /// <summary>
    /// Etapa 1.2: Revisión del Coordinador sobre los documentos adjuntos.
    /// - Si es deficiente: rechaza detallando el motivo y las correcciones necesarias.
    /// - Si es correcta: avanza a la espera del Número de Resolución de Aprobación ('En Espera Resolucion').
    /// </summary>
    [HttpPut("{id:int}/revisar-documentacion")]
    public async Task<ActionResult<SolicitudDto>> RevisarDocumentacion(
        int id,
        [FromBody] RevisarDocumentacionCoordinadorRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UsuarioResponsable))
        {
            request.UsuarioResponsable = Request.Headers["X-Usuario-Responsable"].FirstOrDefault();
        }

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var actualizada = await _solicitudService.RevisarDocumentacionCoordinadorAsync(id, request, ip);
        return Ok(actualizada);
    }

    /// <summary>
    /// Etapa 1.3: Asocia el Número de Resolución de Aprobación e ingresa formalmente el beneficio a la Lista de Pagos Activa.
    /// </summary>
    [HttpPost("{id:int}/emitir-resolucion")]
    public async Task<ActionResult<SolicitudDto>> EmitirResolucion(
        int id,
        [FromBody] EmitirResolucionRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CoordinadorEmisor))
        {
            request.CoordinadorEmisor = Request.Headers["X-Usuario-Responsable"].FirstOrDefault();
        }

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var actualizada = await _solicitudService.EmitirResolucionYActivarPagoAsync(id, request, ip);
        return Ok(actualizada);
    }
}
