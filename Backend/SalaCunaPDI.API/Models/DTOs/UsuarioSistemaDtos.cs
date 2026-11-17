using System.ComponentModel.DataAnnotations;

namespace SalaCunaPDI.API.Models.DTOs;

public class UsuarioSistemaDto
{
    public int UsuarioID { get; set; }
    public string Rut { get; set; } = string.Empty;
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string NombreCompleto => $"{Nombres} {Apellidos}".Trim();
    public string Rol { get; set; } = string.Empty;
    public string CodigoRegion { get; set; } = "RM";
    public string NombreRegion { get; set; } = "Región Metropolitana de Santiago";
    public bool EsRegionMetropolitana => string.Equals(CodigoRegion, "RM", StringComparison.OrdinalIgnoreCase);
    public string CorreoElectronico { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
    public int? FuncionarioID { get; set; }
    public DateTime? FechaCreacion { get; set; }
}

public class LoginRequest
{
    [Required(ErrorMessage = "Debe ingresar su RUT.")]
    public string Rut { get; set; } = string.Empty;

    [Required(ErrorMessage = "Debe ingresar su contraseña.")]
    public string Password { get; set; } = string.Empty;
}

public class CrearActualizarUsuarioSistemaRequest
{
    [Required(ErrorMessage = "El RUT del usuario es obligatorio.")]
    [MaxLength(20)]
    public string Rut { get; set; } = string.Empty;

    [Required(ErrorMessage = "Los nombres son obligatorios.")]
    [MaxLength(100)]
    public string Nombres { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Apellidos { get; set; }

    /// <summary>
    /// Roles válidos: 'Postulante', 'Coordinador', 'Visador', 'Logistica', 'Finanzas', 'Tesoreria', 'Administrador'.
    /// </summary>
    [Required(ErrorMessage = "El rol del usuario es obligatorio.")]
    [MaxLength(50)]
    public string Rol { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? CorreoElectronico { get; set; }

    [MaxLength(100)]
    public string? Password { get; set; }

    public string? CodigoRegion { get; set; } = "RM";
    public string? NombreRegion { get; set; } = "Región Metropolitana de Santiago";
}
