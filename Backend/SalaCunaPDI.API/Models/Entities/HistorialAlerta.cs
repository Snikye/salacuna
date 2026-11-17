namespace SalaCunaPDI.API.Models.Entities;

/// <summary>
/// Representa la tabla HistorialAlertas en la base de datos SalaCunaPDI.
/// </summary>
public class HistorialAlerta
{
    public int AlertaID { get; set; }
    public int? ControlID { get; set; }
    public DateTime? FechaAlerta { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public string? EstadoAlerta { get; set; } = "Enviada"; // Enviada, Revisada

    // Propiedades de navegación
    public virtual ControlMensual? ControlMensual { get; set; }
}
