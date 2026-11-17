namespace SalaCunaPDI.API.Models.Entities;

/// <summary>
/// Representa la tabla Funcionarios (Solicitantes / Beneficiarias PDI).
/// </summary>
public class Funcionario
{
    public int FuncionarioID { get; set; }
    public string Rut { get; set; } = string.Empty;
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
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

    public virtual ICollection<Solicitud> Solicitudes { get; set; } = new List<Solicitud>();
    public virtual ICollection<ControlMensual> ControlesMensuales { get; set; } = new List<ControlMensual>();
}
