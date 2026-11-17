namespace SalaCunaPDI.API.Models.Entities;

/// <summary>
/// Representa la tabla EtapasFlujo (Módulo 3: Historial Secuencial de Etapas del Circuito).
/// </summary>
public class EtapaFlujo
{
    public int EtapaFlujoID { get; set; }
    public int ControlID { get; set; }
    public string NombreEtapa { get; set; } = string.Empty;
    public string AccionRealizada { get; set; } = string.Empty;
    public string EstadoResultante { get; set; } = string.Empty;
    public string UsuarioResponsable { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
    public decimal? MontoEvaluado { get; set; }
    public DateTime? FechaEtapa { get; set; }

    public virtual ControlMensual? ControlMensual { get; set; }
}
