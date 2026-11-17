namespace SalaCunaPDI.API.Models.Entities;

/// <summary>
/// Representa la tabla UsuariosSistema (Postulante, Coordinador, Visador, Logistica, Finanzas, Tesoreria, Administrador).
/// </summary>
public class UsuarioSistema
{
    public int UsuarioID { get; set; }
    public string Rut { get; set; } = string.Empty;
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public string CodigoRegion { get; set; } = "RM";
    public string NombreRegion { get; set; } = "Región Metropolitana de Santiago";
    public string CorreoElectronico { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = "123456";
    public bool Activo { get; set; } = true;
    public DateTime? FechaCreacion { get; set; }

    public virtual ICollection<Solicitud> SolicitudesCoordinadas { get; set; } = new List<Solicitud>();
}
