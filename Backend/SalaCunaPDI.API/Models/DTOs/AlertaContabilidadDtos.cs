using System.ComponentModel.DataAnnotations;

namespace SalaCunaPDI.API.Models.DTOs;

public class HistorialAlertaDto
{
    public int AlertaID { get; set; }
    public int? ControlID { get; set; }
    public int? SolicitudID { get; set; }
    public int? FuncionarioID { get; set; }
    public string? FuncionarioRut { get; set; }
    public string? FuncionarioNombreCompleto { get; set; }
    public string? FuncionarioUnidad { get; set; }
    public int? Anio { get; set; }
    public int? Mes { get; set; }
    public string? EstadoFlujoControl { get; set; }
    public string DestinatarioRol { get; set; } = "Finanzas";
    public DateTime? FechaAlerta { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public string EstadoAlerta { get; set; } = "Enviada";
}

public class RevisarAlertaRequest
{
    public string? UsuarioResponsable { get; set; }
    public string? DetalleRevision { get; set; }
}

public class CrearAlertaManualRequest
{
    public int ControlID { get; set; }
    public string? DestinatarioRol { get; set; } = "Finanzas";
    public string Mensaje { get; set; } = string.Empty;
    public string? UsuarioResponsable { get; set; }
}

public class PresupuestoRegionalDto
{
    public int PresupuestoID { get; set; }
    public int Anio { get; set; }
    public string CodigoRegion { get; set; } = string.Empty;
    public string NombreRegion { get; set; } = string.Empty;
    public bool EsRegionMetropolitana { get; set; }
    public decimal PorcentajeAsignado { get; set; }
    public decimal MontoAsignadoInicial { get; set; }
    public decimal MontoArrastreAnterior { get; set; }
    public decimal MontoPresupuestoVigente => MontoAsignadoInicial + MontoArrastreAnterior;
    public decimal MontoComprometido { get; set; }
    public decimal MontoDevengadoPagado { get; set; }
    public decimal MontoDisponible => (MontoAsignadoInicial + MontoArrastreAnterior) - (MontoComprometido + MontoDevengadoPagado);
    public decimal PorcentajeEjecucion => MontoPresupuestoVigente > 0
        ? Math.Round(((MontoComprometido + MontoDevengadoPagado) / MontoPresupuestoVigente) * 100m, 2)
        : 0m;
    public string? NumeroResolucion { get; set; }
    public DateTime? FechaActualizacion { get; set; }
}

public class ResumenPresupuestoAnualDto
{
    public int Anio { get; set; }
    public string? NumeroResolucion { get; set; }
    public decimal BolsaAnualInicialTotal { get; set; }
    public decimal MontoArrastreTotal { get; set; }
    public decimal PresupuestoVigenteTotal => BolsaAnualInicialTotal + MontoArrastreTotal;
    public decimal MontoAsignadoRM { get; set; }
    public decimal MontoAsignadoRegiones { get; set; }
    public decimal TotalComprometido { get; set; }
    public decimal TotalDevengadoPagado { get; set; }
    public decimal TotalDisponible => PresupuestoVigenteTotal - (TotalComprometido + TotalDevengadoPagado);
    public List<PresupuestoRegionalDto> Regiones { get; set; } = new();
}

public class InicializarPresupuestoAnualRequest
{
    [Range(2020, 2100)]
    public int Anio { get; set; } = 2026;

    [MaxLength(100, ErrorMessage = "El número de resolución no puede superar 100 caracteres.")]
    public string? NumeroResolucion { get; set; } = "RES-DIPRES-2026-0045";

    [Range(1000000, 999999999999, ErrorMessage = "El monto total anual debe ser mayor o igual a $1.000.000.")]
    public decimal MontoTotalAnual { get; set; } = 60000000m;

    [Range(0, 999999999999, ErrorMessage = "El monto designado a regiones no puede ser negativo.")]
    public decimal? MontoDesignadoRegiones { get; set; } = 24000000m;

    public string? UsuarioResponsable { get; set; }
}
