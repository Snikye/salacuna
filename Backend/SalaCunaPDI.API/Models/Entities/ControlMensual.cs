namespace SalaCunaPDI.API.Models.Entities;

/// <summary>
/// Representa la tabla ControlMensual30 (Módulo 2: Notificación Día 30 y Cálculo Proporcional;
/// Módulo 3: Circuito Secuencial Coordinador -> Visador -> Logística -> Finanzas/DECOFI).
/// </summary>
public class ControlMensual
{
    public int ControlID { get; set; }
    public int SolicitudID { get; set; }
    public int? ResolucionID { get; set; }
    public int FuncionarioID { get; set; }
    public int Anio { get; set; }
    public int Mes { get; set; }
    public DateTime? FechaNotificacionDia30 { get; set; }

    public bool TuvoCausalDescuento { get; set; }
    public int DiasBaseMes { get; set; } = 30;
    public int DiasFeriadoLegal { get; set; }
    public int DiasAdministrativos { get; set; }
    public int DiasLicenciaMedica { get; set; }
    public int DiasDescontadosTotales { get; set; }
    public int DiasEfectivos { get; set; } = 30;

    public decimal MontoMensualBase { get; set; }
    public decimal MontoProporcionalCalculado { get; set; }
    public string? RutaArchivoRespaldo { get; set; }

    public string EstadoFlujo { get; set; } = "Notificado Dia 30";

    // Coordinador
    public string? CoordinadorResponsable { get; set; }
    public string? ObservacionCoordinador { get; set; }
    public DateTime? FechaVistoBuenoCoordinador { get; set; }

    // Visador
    public string? VisadorResponsable { get; set; }
    public string? ObservacionVisador { get; set; }
    public DateTime? FechaVisacion { get; set; }

    // Logística
    public string? LogisticaResponsable { get; set; }
    public string? NumeroCompromisoLogistica { get; set; }
    public DateTime? FechaCompromisoLogistica { get; set; }

    // Finanzas, Tesorería y DECOFI
    public string? FinanzasResponsable { get; set; }
    public string? EvaluacionDecofi { get; set; }
    public decimal? MontoDevengadoFinal { get; set; }
    public bool EsArrastrePresupuestaria { get; set; }
    public int? AnioImputacionPresupuestaria { get; set; }
    public string? ComprobanteTesoreria { get; set; }
    public string? DocumentoAutorizacionTexto { get; set; }
    public DateTime? FechaPagoDefinitivo { get; set; }

    public virtual Solicitud? Solicitud { get; set; }
    public virtual Resolucion? Resolucion { get; set; }
    public virtual Funcionario? Funcionario { get; set; }
    public virtual ICollection<EtapaFlujo> EtapasFlujo { get; set; } = new List<EtapaFlujo>();
    public virtual ICollection<HistorialAlerta> HistorialAlertas { get; set; } = new List<HistorialAlerta>();
}
