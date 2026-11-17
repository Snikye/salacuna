using System.ComponentModel.DataAnnotations;

namespace SalaCunaPDI.API.Models.DTOs;

public class ResolucionDto
{
    public int ResolucionID { get; set; }
    public int SolicitudID { get; set; }
    public string NumeroResolucion { get; set; } = string.Empty;
    public DateOnly FechaResolucion { get; set; }
    public decimal MontoMensualAprobado { get; set; }
    public DateOnly FechaInicioBeneficio { get; set; }
    public DateOnly? FechaTerminoBeneficio { get; set; }
    public string EstadoResolucion { get; set; } = "Vigente";
    public string? CoordinadorEmisor { get; set; }
    public string? Observaciones { get; set; }
    public DateTime? FechaRegistro { get; set; }
}

public class SolicitudDto
{
    public int SolicitudID { get; set; }
    public int FuncionarioID { get; set; }
    public string? FuncionarioRut { get; set; }
    public string? FuncionarioNombreCompleto { get; set; }
    public string? FuncionarioUnidad { get; set; }
    public string? FuncionarioEscalafon { get; set; }
    public string? FuncionarioTelefono { get; set; }
    public string? FuncionarioNumeroSide { get; set; }
    public string? FuncionarioCorreo { get; set; }
    public string? NombreMenor { get; set; }
    public string? RutMenor { get; set; }
    public DateOnly? FechaNacimientoMenor { get; set; }
    public int? CoordinadorID { get; set; }
    public string? CoordinadorNombre { get; set; }
    public string CodigoRegion { get; set; } = "RM";
    public string? NombreRegion { get; set; }
    public decimal MontoMensualBase { get; set; } = 385000m;
    public int CantidadDocumentosRequeridos { get; set; } = 5;
    public int CantidadDocumentosSubidos { get; set; }
    public bool CarpetaCompleta => CantidadDocumentosSubidos >= CantidadDocumentosRequeridos;
    public DateTime? FechaSolicitud { get; set; }

    /// <summary>
    /// Estados Etapa 1:
    /// - 'En Postulacion'
    /// - 'En Revision Coordinador'
    /// - 'Rechazada por Coordinador'
    /// - 'En Espera Resolucion'
    /// - 'En Lista de Pago Activa'
    /// - 'Beneficio Cancelado'
    /// </summary>
    public string Estado { get; set; } = "En Postulacion";

    public string? MotivoRechazoCorrecciones { get; set; }
    public string? ObservacionesCoordinador { get; set; }
    public DateTime? FechaRevisionCoordinador { get; set; }
    public DateTime? FechaIngresoListaPago { get; set; }
    public bool EnListaPagoActiva { get; set; }

    public ResolucionDto? Resolucion { get; set; }
    public List<DocumentoInicialDto> DocumentosIniciales { get; set; } = new();
}

public class CrearSolicitudRequest
{
    [Required(ErrorMessage = "El ID del funcionario es obligatorio.")]
    public int FuncionarioID { get; set; }

    public int? CoordinadorID { get; set; }

    [MaxLength(10)]
    public string? CodigoRegion { get; set; }

    [Range(1, 5000000)]
    public decimal MontoMensualBase { get; set; } = 385000m;

    [Range(1, 20)]
    public int CantidadDocumentosRequeridos { get; set; } = 5;

    public string? ObservacionesIniciales { get; set; }
}

public class EvaluacionDocumentoItemDto
{
    public int DocumentoID { get; set; }
    public bool Aprobado { get; set; }
    public string? Observacion { get; set; }
}

/// <summary>
/// Revisión del Coordinador sobre la documentación adjunta (Etapa 1).
/// Permite aprobar o rechazar documento por documento con observaciones específicas.
/// - Si todos los documentos son aprobados: avanza a 'En Espera Resolucion'.
/// - Si algún documento no es aprobado: queda en 'Rechazada por Coordinador' con observaciones.
/// </summary>
public class RevisarDocumentacionCoordinadorRequest
{
    public bool AprobarDocumentacion { get; set; }

    public string? MotivoRechazoCorrecciones { get; set; }

    public string? ObservacionesCoordinador { get; set; }

    public int? CoordinadorID { get; set; }

    public string? UsuarioResponsable { get; set; }

    public List<EvaluacionDocumentoItemDto> EvaluacionesDocumentos { get; set; } = new();
}

/// <summary>
/// Asociación del Número de Resolución de Aprobación e ingreso formal a la Lista de Pagos Activa (Etapa 1).
/// </summary>
public class EmitirResolucionRequest
{
    [Required(ErrorMessage = "El Número de Resolución de Aprobación es obligatorio.")]
    [MaxLength(80)]
    public string NumeroResolucion { get; set; } = string.Empty;

    public DateOnly? FechaResolucion { get; set; }

    [Range(1, 5000000, ErrorMessage = "El monto mensual aprobado debe ser mayor a cero.")]
    public decimal MontoMensualAprobado { get; set; } = 385000m;

    public DateOnly? FechaInicioBeneficio { get; set; }

    public string? CoordinadorEmisor { get; set; }

    public string? Observaciones { get; set; }
}
