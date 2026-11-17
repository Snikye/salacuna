using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace SalaCunaPDI.API.Models.DTOs;

public class DocumentoInicialDto
{
    public int DocumentoID { get; set; }
    public int SolicitudID { get; set; }
    public string TipoDocumento { get; set; } = string.Empty;
    public string NombreArchivo { get; set; } = string.Empty;
    public string RutaAlmacenamiento { get; set; } = string.Empty;
    public string EstadoDocumento { get; set; } = "Recibido";
    public string? ObservacionDocumento { get; set; }
    public DateTime? FechaSubida { get; set; }
    public string UrlDescarga => $"/api/documentos-iniciales/{DocumentoID}/descargar";
}

public class SubirDocumentoInicialRequest
{
    [Required(ErrorMessage = "El ID de la solicitud es obligatorio.")]
    public int SolicitudID { get; set; }

    [Required(ErrorMessage = "El tipo de documento es obligatorio.")]
    [MaxLength(80)]
    public string TipoDocumento { get; set; } = string.Empty;

    [Required(ErrorMessage = "El archivo PDF es obligatorio.")]
    public IFormFile Archivo { get; set; } = null!;

    public string? UsuarioResponsable { get; set; }
}
