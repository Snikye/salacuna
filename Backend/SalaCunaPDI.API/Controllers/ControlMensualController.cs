using Microsoft.AspNetCore.Mvc;
using SalaCunaPDI.API.Models.DTOs;
using SalaCunaPDI.API.Services.Interfaces;

namespace SalaCunaPDI.API.Controllers;

[ApiController]
[Route("api/control-mensual")]
public class ControlMensualController : ControllerBase
{
    private readonly IControlMensualService _controlMensualService;

    public ControlMensualController(IControlMensualService controlMensualService)
    {
        _controlMensualService = controlMensualService;
    }

    /// <summary>
    /// Lista los registros de Control Mensual (Día 30 y Circuito) aplicando filtros opcionales.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<ControlMensualDto>>> Listar(
        [FromQuery] int? anio = null,
        [FromQuery] int? mes = null,
        [FromQuery] string? estadoFlujo = null,
        [FromQuery] int? funcionarioId = null,
        [FromQuery] string? codigoRegion = null)
    {
        var lista = await _controlMensualService.ListarControlesAsync(
            anio, mes, estadoFlujo, funcionarioId, codigoRegion);
        return Ok(lista);
    }

    /// <summary>
    /// Obtiene un expediente mensual por su ControlID, incluyendo el historial de EtapasFlujo.
    /// </summary>
    [HttpGet("{controlId:int}")]
    public async Task<ActionResult<ControlMensualDto>> ObtenerPorId(int controlId)
    {
        var dto = await _controlMensualService.ObtenerPorIdAsync(controlId);
        if (dto == null)
        {
            return NotFound(new { mensaje = $"No se encontró el expediente mensual con ID {controlId}." });
        }
        return Ok(dto);
    }

    /// <summary>
    /// Obtiene el historial de controles mensuales de un funcionario específico.
    /// </summary>
    [HttpGet("funcionario/{funcionarioId:int}")]
    public async Task<ActionResult<List<ControlMensualDto>>> ListarPorFuncionario(int funcionarioId)
    {
        var lista = await _controlMensualService.ListarControlesAsync(funcionarioId: funcionarioId);
        return Ok(lista);
    }

    /// <summary>
    /// MÓDULO 2: Declaración Obligatoria del Día 30 de Asistencia y Licencias.
    /// Calcula los días efectivos sobre base de 30 días y el monto proporcional del Bono.
    /// </summary>
    [HttpPost("declaracion-dia30")]
    [RequestSizeLimit(12 * 1024 * 1024)]
    public async Task<ActionResult<ControlMensualDto>> RegistrarDeclaracionDia30(
        [FromForm] DeclaracionDia30Request request)
    {
        if (string.IsNullOrWhiteSpace(request.UsuarioResponsable))
        {
            request.UsuarioResponsable = Request.Headers["X-Usuario-Responsable"].FirstOrDefault();
        }

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var resultado = await _controlMensualService.RegistrarDeclaracionDia30Async(request, ip);
        return Ok(resultado);
    }

    /// <summary>
    /// MÓDULO 3: Avanza o devuelve una etapa del Circuito Administrativo Secuencial
    /// (Coordinador -> Visador -> Logística -> Finanzas y Tesorería / DECOFI).
    /// </summary>
    [HttpPut("{controlId:int}/avanzar-etapa")]
    public async Task<ActionResult<ControlMensualDto>> AvanzarEtapaCircuito(
        int controlId,
        [FromBody] AvanzarEtapaCircuitoRequest request)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var resultado = await _controlMensualService.AvanzarEtapaCircuitoAsync(controlId, request, ip);
        return Ok(resultado);
    }

    /// <summary>
    /// Visualiza en el navegador el archivo PDF de respaldo de la Declaración del Día 30 sin forzar descarga (Content-Disposition: inline).
    /// </summary>
    [HttpGet("{controlId:int}/ver")]
    public async Task<IActionResult> VisualizarArchivoRespaldo(int controlId)
    {
        var (fileStream, fileName) = await _controlMensualService.ObtenerArchivoRespaldoAsync(controlId);
        Response.Headers.Append("Content-Disposition", $"inline; filename=\"{fileName}\"");
        return File(fileStream, "application/pdf", enableRangeProcessing: true);
    }

    /// <summary>
    /// Descarga forzadamente el archivo PDF de respaldo de la Declaración del Día 30 (Content-Disposition: attachment).
    /// </summary>
    [HttpGet("{controlId:int}/descargar")]
    public async Task<IActionResult> DescargarArchivoRespaldo(int controlId)
    {
        var (fileStream, fileName) = await _controlMensualService.ObtenerArchivoRespaldoAsync(controlId);
        return File(fileStream, "application/pdf", fileName, enableRangeProcessing: true);
    }
}
