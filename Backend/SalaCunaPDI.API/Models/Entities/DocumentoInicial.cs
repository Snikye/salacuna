namespace SalaCunaPDI.API.Models.Entities;

/// <summary>
/// Representa la tabla DocumentosIniciales (Los X documentos requeridos adjuntos por el solicitante).
/// </summary>
public class DocumentoInicial
{
    public int DocumentoID { get; set; }
    public int SolicitudID { get; set; }
    public string TipoDocumento { get; set; } = string.Empty;
    public string NombreArchivo { get; set; } = string.Empty;
    public string RutaAlmacenamiento { get; set; } = string.Empty;
    public string EstadoDocumento { get; set; } = "Cargado";
    public string? ObservacionDocumento { get; set; }
    public DateTime? FechaSubida { get; set; }

    public virtual Solicitud? Solicitud { get; set; }
}
