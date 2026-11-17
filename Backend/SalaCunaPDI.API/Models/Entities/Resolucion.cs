namespace SalaCunaPDI.API.Models.Entities;

/// <summary>
/// Representa la tabla Resoluciones (Módulo 1: Número de Resolución de Aprobación e Ingreso a Lista de Pago Activa).
/// </summary>
public class Resolucion
{
    public int ResolucionID { get; set; }
    public int SolicitudID { get; set; }
    public string NumeroResolucion { get; set; } = string.Empty;
    public DateOnly FechaResolucion { get; set; }
    public decimal MontoMensualAprobado { get; set; }
    public string CodigoRegion { get; set; } = "RM";
    public string CoordinadorEmisor { get; set; } = string.Empty;
    public string? ObservacionesResolucion { get; set; }
    public bool ActivoEnListaPago { get; set; } = true;
    public DateTime? FechaIngresoListaPago { get; set; }

    public virtual Solicitud? Solicitud { get; set; }
    public virtual ICollection<ControlMensual> ControlesMensuales { get; set; } = new List<ControlMensual>();
}
