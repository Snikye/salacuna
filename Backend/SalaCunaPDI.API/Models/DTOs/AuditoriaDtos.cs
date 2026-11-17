namespace SalaCunaPDI.API.Models.DTOs;

public class AuditoriaSistemaDto
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
