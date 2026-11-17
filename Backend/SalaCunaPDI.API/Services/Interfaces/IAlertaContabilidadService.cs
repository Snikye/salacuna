using SalaCunaPDI.API.Models.DTOs;

namespace SalaCunaPDI.API.Services.Interfaces;

public interface IAlertaContabilidadService
{
    Task<List<HistorialAlertaDto>> GenerarAlertasPendientesAsync(
        string? usuarioResponsable,
        string? direccionIp);

    Task<List<HistorialAlertaDto>> ListarAlertasAsync(string? estadoAlerta = null);

    Task<HistorialAlertaDto> MarcarAlertaRevisadaAsync(
        int alertaId,
        RevisarAlertaRequest request,
        string? direccionIp);

    Task<ResumenPresupuestoAnualDto> ObtenerPresupuestoAnualRegionalAsync(int anio);

    Task<ResumenPresupuestoAnualDto> InicializarPresupuestoAnualRegionalAsync(
        InicializarPresupuestoAnualRequest request,
        string? direccionIp);
}
