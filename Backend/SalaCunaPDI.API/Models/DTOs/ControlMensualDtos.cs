using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace SalaCunaPDI.API.Models.DTOs;

public class EtapaFlujoDto
{
    public int EtapaID { get; set; }
    public int ControlID { get; set; }
    public string RolResponsable { get; set; } = string.Empty;
    public string NombreResponsable { get; set; } = string.Empty;
    public string AccionRealizada { get; set; } = string.Empty;
    public string EstadoResultante { get; set; } = string.Empty;
    public decimal? MontoInvolucrado { get; set; }
    public int? AnioImputacion { get; set; }
    public bool EsArrastrePresupuestario { get; set; }
    public string? EvaluacionDecofi { get; set; }
    public string? Observaciones { get; set; }
    public DateTime FechaRegistro { get; set; }
}

public class ControlMensualDto
{
    public int ControlID { get; set; }
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

    public int? ResolucionID { get; set; }
    public string? NumeroResolucion { get; set; }

    public int Anio { get; set; }
    public int Mes { get; set; }
    public string CodigoRegion { get; set; } = "RM";
    public DateTime FechaNotificacionDia30 { get; set; }

    // Declaración Día 30 (Módulo 2)
    public bool TuvoCausalDescuento { get; set; }
    public int DiasBaseMes { get; set; } = 30;
    public int DiasFeriadoLegal { get; set; }
    public int DiasAdministrativos { get; set; }
    public int DiasLicenciaMedica { get; set; }
    public int DiasDescontadosTotales { get; set; }
    public int DiasEfectivos { get; set; } = 30;

    // Cálculo proporcional del Bono
    public decimal MontoMensualBase { get; set; }
    public decimal MontoProporcionalCalculado { get; set; }

    public string? RutaArchivoRespaldo { get; set; }
    public string? UrlDescargaArchivo => !string.IsNullOrWhiteSpace(RutaArchivoRespaldo)
        ? $"/api/control-mensual/{ControlID}/descargar"
        : null;

    /// <summary>
    /// Estados del Circuito (Módulos 2 y 3):
    /// - 'Declarado Dia 30'
    /// - 'Devuelto a Coordinador'
    /// - 'Visto Bueno Coordinador'
    /// - 'Beneficio Cancelado'
    /// - 'Visado Conforme'
    /// - 'Compromiso Logistica'
    /// - 'Pagado Finanzas'
    /// - 'Arrastre Presupuestario'
    /// </summary>
    public string EstadoFlujo { get; set; } = "Declarado Dia 30";

    // 1. Coordinador
    public string? CoordinadorResponsable { get; set; }
    public string? ObservacionCoordinador { get; set; }
    public DateTime? FechaVistoBuenoCoordinador { get; set; }

    // 2. Visador
    public string? VisadorResponsable { get; set; }
    public string? ObservacionVisador { get; set; }
    public DateTime? FechaVisacion { get; set; }

    // 3. Logística
    public string? LogisticaResponsable { get; set; }
    public string? NumeroCompromisoPago { get; set; }
    public DateTime? FechaCompromisoLogistica { get; set; }

    // 4. Finanzas y Tesorería / DECOFI
    public string? FinanzasResponsable { get; set; }
    public string? TipoEjecucionFinanzas { get; set; }
    public int? AnioImputacionPresupuestaria { get; set; }
    public string? EvaluacionDecofi { get; set; }
    public string? ComprobanteTesoreria { get; set; }
    public DateTime? FechaEjecucionFinanzas { get; set; }

    public List<EtapaFlujoDto> EtapasFlujo { get; set; } = new();
}

/// <summary>
/// MÓDULO 2: Declaración Obligatoria del Día 30 de Asistencia y Licencias.
/// </summary>
public class DeclaracionDia30Request
{
    [Required(ErrorMessage = "El ID de la solicitud en lista de pago es obligatorio.")]
    public int SolicitudID { get; set; }

    [Range(2020, 2100)]
    public int Anio { get; set; }

    [Range(1, 12)]
    public int Mes { get; set; }

    /// <summary>
    /// False = NO hizo uso de ninguna causal (continúa por los 30 días completos).
    /// True = SÍ hizo uso de Feriado Legal, Días Administrativos o Licencia Médica.
    /// </summary>
    [Required]
    public bool TuvoCausalDescuento { get; set; }

    [Range(0, 30, ErrorMessage = "Los días de feriado legal deben estar entre 0 y 30.")]
    public int DiasFeriadoLegal { get; set; } = 0;

    [Range(0, 30, ErrorMessage = "Los días administrativos deben estar entre 0 y 30.")]
    public int DiasAdministrativos { get; set; } = 0;

    [Range(0, 30, ErrorMessage = "Los días de licencia médica deben estar entre 0 y 30.")]
    public int DiasLicenciaMedica { get; set; } = 0;

    public IFormFile? ArchivoRespaldo { get; set; }

    public string? UsuarioResponsable { get; set; }
}

/// <summary>
/// MÓDULO 3: Transición secuencial del Circuito Administrativo (Coordinador -> Visador -> Logística -> Finanzas/DECOFI).
/// </summary>
public class AvanzarEtapaCircuitoRequest
{
    /// <summary>
    /// Roles válidos: 'COORDINADOR', 'VISADOR', 'LOGISTICA', 'FINANZAS'
    /// </summary>
    [Required]
    public string RolAccion { get; set; } = string.Empty;

    /// <summary>
    /// Acciones válidas según rol:
    /// - COORDINADOR: 'VISTO_BUENO' | 'CANCELAR_BENEFICIO'
    /// - VISADOR: 'APROBAR' | 'DEVOLVER'
    /// - LOGISTICA: 'COMPROMETER'
    /// - FINANZAS: 'DEVENGAR_PAGAR' | 'ARRASTRE'
    /// </summary>
    [Required]
    public string Accion { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre del responsable es obligatorio.")]
    [MaxLength(150)]
    public string NombreResponsable { get; set; } = string.Empty;

    public string? Observaciones { get; set; }

    public string? NumeroDocumentoCompromiso { get; set; }

    public int? AnioArrastreDestino { get; set; }

    public string? EvaluacionDecofi { get; set; }
}
