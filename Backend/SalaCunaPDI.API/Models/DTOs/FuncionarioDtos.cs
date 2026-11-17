using System.ComponentModel.DataAnnotations;

namespace SalaCunaPDI.API.Models.DTOs;

public class FuncionarioDto
{
    public int FuncionarioID { get; set; }
    public string Rut { get; set; } = string.Empty;
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string NombreCompleto => $"{Nombres} {Apellidos}".Trim();
    public string? Escalafon { get; set; }
    public string? Unidad { get; set; }
    public string CodigoRegion { get; set; } = "RM";
    public string NombreRegion { get; set; } = "Región Metropolitana de Santiago";
    public string? Telefono { get; set; }
    public string? NumeroSide { get; set; }
    public string CorreoElectronico { get; set; } = string.Empty;
    public string? NombreMenor { get; set; }
    public string? RutMenor { get; set; }
    public DateOnly? FechaNacimientoMenor { get; set; }
    public DateTime? FechaRegistro { get; set; }
}

public class SincronizarFuncionarioRequest
{
    [Required(ErrorMessage = "El RUT es obligatorio.")]
    [MaxLength(15)]
    public string Rut { get; set; } = string.Empty;

    [Required(ErrorMessage = "Los nombres son obligatorios.")]
    [MaxLength(100)]
    public string Nombres { get; set; } = string.Empty;

    [Required(ErrorMessage = "Los apellidos son obligatorios.")]
    [MaxLength(100)]
    public string Apellidos { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Escalafon { get; set; }

    [MaxLength(100)]
    public string? Unidad { get; set; }

    [MaxLength(10)]
    public string? CodigoRegion { get; set; } = "RM";

    [MaxLength(120)]
    public string? NombreRegion { get; set; } = "Región Metropolitana de Santiago";

    [MaxLength(20)]
    public string? Telefono { get; set; }

    [MaxLength(50)]
    public string? NumeroSide { get; set; }

    [Required(ErrorMessage = "El correo electrónico es obligatorio.")]
    [EmailAddress(ErrorMessage = "El formato del correo electrónico no es válido.")]
    [MaxLength(100)]
    public string CorreoElectronico { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? NombreMenor { get; set; }

    [MaxLength(15)]
    public string? RutMenor { get; set; }

    public DateOnly? FechaNacimientoMenor { get; set; }
}
