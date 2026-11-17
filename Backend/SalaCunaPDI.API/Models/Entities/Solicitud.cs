namespace SalaCunaPDI.API.Models.Entities;

/// <summary>
/// Representa la tabla Solicitudes (Módulo 1: Postulación al Bono Compensatorio y Revisión del Coordinador).
/// </summary>
public class Solicitud
{
    public int SolicitudID { get; set; }
    public int FuncionarioID { get; set; }
    public int? CoordinadorID { get; set; }
    public string CodigoRegion { get; set; } = "RM";
    public decimal MontoMensualBase { get; set; } = 385000m;
    public int CantidadDocumentosRequeridos { get; set; } = 5;
    public string Estado { get; set; } = "En Postulacion";
    public string? MotivoRechazoCorrecciones { get; set; }
    public string? ObservacionesCoordinador { get; set; }
    public bool EnListaPagoActiva { get; set; }
    public DateTime? FechaSolicitud { get; set; }
    public DateTime? FechaRevisionCoordinador { get; set; }

    public virtual Funcionario? Funcionario { get; set; }
    public virtual UsuarioSistema? Coordinador { get; set; }
    public virtual Resolucion? Resolucion { get; set; }
    public virtual ICollection<DocumentoInicial> DocumentosIniciales { get; set; } = new List<DocumentoInicial>();
    public virtual ICollection<ControlMensual> ControlesMensuales { get; set; } = new List<ControlMensual>();
}
