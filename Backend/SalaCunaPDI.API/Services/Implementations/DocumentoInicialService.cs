using Microsoft.EntityFrameworkCore;
using SalaCunaPDI.API.Data;
using SalaCunaPDI.API.Helpers;
using SalaCunaPDI.API.Models.DTOs;
using SalaCunaPDI.API.Models.Entities;
using SalaCunaPDI.API.Services.Interfaces;

namespace SalaCunaPDI.API.Services.Implementations;

public class DocumentoInicialService : IDocumentoInicialService
{
    private readonly SalaCunaDbContext _context;
    private readonly IAuditoriaService _auditoriaService;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;

    public DocumentoInicialService(
        SalaCunaDbContext context,
        IAuditoriaService auditoriaService,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        _context = context;
        _auditoriaService = auditoriaService;
        _configuration = configuration;
        _environment = environment;
    }

    public async Task<DocumentoInicialDto> SubirDocumentoAsync(
        SubirDocumentoInicialRequest request,
        string? direccionIp)
    {
        PdfFileValidator.ValidatePdfFile(request.Archivo);

        var solicitud = await _context.Solicitudes
            .Include(s => s.Funcionario)
            .Include(s => s.DocumentosIniciales)
            .FirstOrDefaultAsync(s => s.SolicitudID == request.SolicitudID)
            ?? throw new KeyNotFoundException($"No se encontró la solicitud con ID {request.SolicitudID}.");

        var tipoNormalizado = request.TipoDocumento.Trim();

        var documentoExistente = solicitud.DocumentosIniciales
            .FirstOrDefault(d => string.Equals(d.TipoDocumento, tipoNormalizado, StringComparison.OrdinalIgnoreCase));

        var maxDocs = solicitud.CantidadDocumentosRequeridos > 0 ? solicitud.CantidadDocumentosRequeridos : 4;
        if (documentoExistente == null && solicitud.DocumentosIniciales.Count >= maxDocs && maxDocs >= 20)
        {
            throw new InvalidOperationException(
                $"La Carpeta Virtual de esta solicitud ya alcanzó el límite de {maxDocs} documentos.");
        }

        var baseStoragePath = ObtenerRutaBaseAlmacenamiento();
        var carpetaSolicitud = Path.Combine(baseStoragePath, "DocumentosIniciales", $"Solicitud_{solicitud.SolicitudID}");
        Directory.CreateDirectory(carpetaSolicitud);

        var nombreSanitizado = PdfFileValidator.SanitizeFileName(request.Archivo.FileName);
        var nombreFisicoUnico = $"{DateTime.Now:yyyyMMddHHmmss}_{Guid.NewGuid():N}_{nombreSanitizado}";
        var rutaFisicaCompleta = Path.Combine(carpetaSolicitud, nombreFisicoUnico);

        await using (var fileStream = new FileStream(rutaFisicaCompleta, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await request.Archivo.CopyToAsync(fileStream);
        }

        var responsable = !string.IsNullOrWhiteSpace(request.UsuarioResponsable)
            ? request.UsuarioResponsable.Trim()
            : solicitud.Funcionario?.Rut ?? "Funcionario";

        DocumentoInicial docResult;

        if (documentoExistente != null)
        {
            IntentarEliminarArchivoFisico(documentoExistente.RutaAlmacenamiento);

            documentoExistente.TipoDocumento = tipoNormalizado;
            documentoExistente.NombreArchivo = request.Archivo.FileName;
            documentoExistente.RutaAlmacenamiento = rutaFisicaCompleta;
            documentoExistente.EstadoDocumento = "Recibido";
            documentoExistente.FechaSubida = DateTime.Now;
            docResult = documentoExistente;
        }
        else
        {
            var nuevoDoc = new DocumentoInicial
            {
                SolicitudID = solicitud.SolicitudID,
                TipoDocumento = tipoNormalizado,
                NombreArchivo = request.Archivo.FileName,
                RutaAlmacenamiento = rutaFisicaCompleta,
                EstadoDocumento = "Recibido",
                FechaSubida = DateTime.Now
            };

            _context.DocumentosIniciales.Add(nuevoDoc);
            solicitud.DocumentosIniciales.Add(nuevoDoc);
            docResult = nuevoDoc;
        }

        // Si la postulación alcanza los X documentos requeridos y estaba en 'En Postulacion' o 'Rechazada por Coordinador',
        // avanza automáticamente a 'En Revision Coordinador'
        if (solicitud.DocumentosIniciales.Count >= solicitud.CantidadDocumentosRequeridos &&
            (solicitud.Estado == "En Postulacion" || solicitud.Estado == "Rechazada por Coordinador"))
        {
            solicitud.Estado = "En Revision Coordinador";
        }

        await _context.SaveChangesAsync();

        await _auditoriaService.RegistrarAsync(
            responsable,
            "SUBIR_DOCUMENTO_ETAPA1",
            "DocumentosIniciales",
            docResult.DocumentoID,
            $"Se adjuntó el documento '{tipoNormalizado}' ({request.Archivo.FileName}) en la Postulación #{solicitud.SolicitudID}. Estado solicitud: '{solicitud.Estado}'.",
            direccionIp);

        return MapToDto(docResult);
    }

    public async Task<List<DocumentoInicialDto>> ListarPorSolicitudAsync(int solicitudId)
    {
        var docs = await _context.DocumentosIniciales
            .AsNoTracking()
            .Where(d => d.SolicitudID == solicitudId)
            .OrderBy(d => d.DocumentoID)
            .ToListAsync();

        return docs.Select(MapToDto).ToList();
    }

    public async Task<(Stream FileStream, string FileName)> ObtenerArchivoParaDescargaAsync(int documentoId)
    {
        var doc = await _context.DocumentosIniciales
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.DocumentoID == documentoId)
            ?? throw new KeyNotFoundException($"No se encontró el documento con ID {documentoId}.");

        if (string.IsNullOrWhiteSpace(doc.RutaAlmacenamiento) || !File.Exists(doc.RutaAlmacenamiento))
        {
            throw new FileNotFoundException("El archivo físico PDF no se encuentra en la ruta de almacenamiento registrada.");
        }

        var stream = new FileStream(doc.RutaAlmacenamiento, FileMode.Open, FileAccess.Read, FileShare.Read);
        return (stream, doc.NombreArchivo);
    }

    public async Task EliminarDocumentoAsync(
        int documentoId,
        string? usuarioResponsable,
        string? direccionIp)
    {
        var doc = await _context.DocumentosIniciales
            .Include(d => d.Solicitud)
            .FirstOrDefaultAsync(d => d.DocumentoID == documentoId)
            ?? throw new KeyNotFoundException($"No se encontró el documento con ID {documentoId}.");

        if (doc.Solicitud?.EnListaPagoActiva == true)
        {
            throw new InvalidOperationException("No se pueden eliminar documentos de una solicitud que ya cuenta con Resolución vigente en la Lista de Pago Activa.");
        }

        var rutaFisica = doc.RutaAlmacenamiento;
        var nombreArchivo = doc.NombreArchivo;
        var tipoDoc = doc.TipoDocumento;
        var solicitudId = doc.SolicitudID;

        _context.DocumentosIniciales.Remove(doc);
        await _context.SaveChangesAsync();

        IntentarEliminarArchivoFisico(rutaFisica);

        await _auditoriaService.RegistrarAsync(
            string.IsNullOrWhiteSpace(usuarioResponsable) ? "Sistema" : usuarioResponsable.Trim(),
            "ELIMINAR_DOCUMENTO_ETAPA1",
            "DocumentosIniciales",
            documentoId,
            $"Se eliminó el documento '{tipoDoc}' ({nombreArchivo}) de la Postulación #{solicitudId}.",
            direccionIp);
    }

    private string ObtenerRutaBaseAlmacenamiento()
    {
        var rutaConfigurada = _configuration["StorageSettings:BasePath"];
        if (!string.IsNullOrWhiteSpace(rutaConfigurada))
        {
            return Path.IsPathRooted(rutaConfigurada)
                ? rutaConfigurada
                : Path.Combine(_environment.ContentRootPath, rutaConfigurada);
        }

        return Path.Combine(_environment.ContentRootPath, "Storage");
    }

    private static void IntentarEliminarArchivoFisico(string? ruta)
    {
        try
        {
            if (!string.IsNullOrWhiteSpace(ruta) && File.Exists(ruta))
            {
                File.Delete(ruta);
            }
        }
        catch
        {
        }
    }

    private static DocumentoInicialDto MapToDto(DocumentoInicial d)
    {
        return new DocumentoInicialDto
        {
            DocumentoID = d.DocumentoID,
            SolicitudID = d.SolicitudID,
            TipoDocumento = d.TipoDocumento,
            NombreArchivo = d.NombreArchivo,
            RutaAlmacenamiento = d.RutaAlmacenamiento,
            EstadoDocumento = d.EstadoDocumento,
            ObservacionDocumento = d.ObservacionDocumento,
            FechaSubida = d.FechaSubida
        };
    }
}
