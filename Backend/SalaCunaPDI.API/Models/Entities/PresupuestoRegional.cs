namespace SalaCunaPDI.API.Models.Entities;

/// <summary>
/// Representa la tabla PresupuestoRegional (Módulo 4: 60% RM / 40% Regiones y Arrastre Presupuestario).
/// </summary>
public class PresupuestoRegional
{
    public int PresupuestoID { get; set; }
    public int Anio { get; set; }
    public string CodigoRegion { get; set; } = string.Empty;
    public string NombreRegion { get; set; } = string.Empty;
    public bool EsRegionMetropolitana { get; set; }
    public decimal PorcentajeAsignado { get; set; }
    public decimal BolsaGlobalAnual { get; set; }
    public decimal MontoAsignadoInicial { get; set; }
    public decimal MontoArrastreAnterior { get; set; }
    public decimal MontoComprometido { get; set; }
    public decimal MontoDevengadoPagado { get; set; }
    public decimal MontoArrastreSiguienteAnio { get; set; }
    public string? NumeroResolucion { get; set; }
    public DateTime? FechaActualizacion { get; set; }
}
