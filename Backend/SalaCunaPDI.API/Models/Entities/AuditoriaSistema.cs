namespace SalaCunaPDI.API.Models.Entities;

/// <summary>
/// Representa la tabla AuditoriaSistema en la base de datos SalaCunaPDI.
/// </summary>
public class AuditoriaSistema
{
    public int AuditoriaID { get; set; }
    public string UsuarioResponsable { get; set; } = string.Empty;
    public string Accion { get; set; } = string.Empty;
    public string TablaAfectada { get; set; } = string.Empty;
    public int RegistroID { get; set; }
    public string? DetalleCambio { get; set; }
    public string? DireccionIP { get; set; }
    public DateTime? FechaHora { get; set; }
}
