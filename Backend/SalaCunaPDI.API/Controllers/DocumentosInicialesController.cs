using Microsoft.AspNetCore.Mvc;
using SalaCunaPDI.API.Models.DTOs;
using SalaCunaPDI.API.Services.Interfaces;

namespace SalaCunaPDI.API.Controllers;

[ApiController]
[Route("api/documentos-iniciales")]
public class DocumentosInicialesController : ControllerBase
{
    private readonly IDocumentoInicialService _documentoService;

    public DocumentosInicialesController(IDocumentoInicialService documentoService)
    {
        _documentoService = documentoService;
    }

    /// <summary>
    /// Lista los documentos PDF iniciales (Carpeta Virtual) asociados a una solicitud.
    /// </summary>
    [HttpGet("solicitud/{solicitudId:int}")]
    public async Task<ActionResult<List<DocumentoInicialDto>>> ListarPorSolicitud(int solicitudId)
    {
        var documentos = await _documentoService.ListarPorSolicitudAsync(solicitudId);
        return Ok(documentos);
    }

    /// <summary>
    /// Sube y almacena de forma segura uno de los 5 archivos PDF iniciales de la Carpeta Virtual.
    /// </summary>
    [HttpPost("subir")]
    [RequestSizeLimit(12 * 1024 * 1024)]
    public async Task<ActionResult<DocumentoInicialDto>> Subir([FromForm] SubirDocumentoInicialRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UsuarioResponsable))
        {
            request.UsuarioResponsable = Request.Headers["X-Usuario-Responsable"].FirstOrDefault();
        }

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var resultado = await _documentoService.SubirDocumentoAsync(request, ip);
        return Ok(resultado);
    }

    /// <summary>
    /// Permite visualizar un archivo PDF de la Carpeta Virtual directamente en el navegador sin forzar la descarga (Content-Disposition: inline).
    /// </summary>
    [HttpGet("{documentoId:int}/ver")]
    public async Task<IActionResult> Visualizar(int documentoId)
    {
        var (fileStream, fileName) = await _documentoService.ObtenerArchivoParaDescargaAsync(documentoId);
        Response.Headers.Append("Content-Disposition", $"inline; filename=\"{fileName}\"");
        return File(fileStream, "application/pdf", enableRangeProcessing: true);
    }

    /// <summary>
    /// Permite descargar forzadamente un archivo PDF de la Carpeta Virtual (Content-Disposition: attachment).
    /// </summary>
    [HttpGet("{documentoId:int}/descargar")]
    public async Task<IActionResult> Descargar(int documentoId)
    {
        var (fileStream, fileName) = await _documentoService.ObtenerArchivoParaDescargaAsync(documentoId);
        return File(fileStream, "application/pdf", fileName, enableRangeProcessing: true);
    }

    /// <summary>
    /// Elimina un documento inicial de una solicitud que aún no ha sido aprobada.
    /// </summary>
    [HttpDelete("{documentoId:int}")]
    public async Task<IActionResult> Eliminar(int documentoId, [FromQuery] string? usuarioResponsable = null)
    {
        var responsable = usuarioResponsable ?? Request.Headers["X-Usuario-Responsable"].FirstOrDefault();
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        await _documentoService.EliminarDocumentoAsync(documentoId, responsable, ip);
        return NoContent();
    }
}
