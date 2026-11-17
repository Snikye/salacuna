using SalaCunaPDI.API.Models.DTOs;

namespace SalaCunaPDI.API.Services.Interfaces;

public interface ISolicitudService
{
    Task<SolicitudDto> CrearSolicitudAsync(
        CrearSolicitudRequest request,
        string? usuarioResponsable,
        string? direccionIp);

    Task<List<SolicitudDto>> ListarSolicitudesAsync(string? estado = null, bool? enListaPagoActiva = null, string? codigoRegion = null);
    Task<List<SolicitudDto>> ListarPendientesAsync(string? codigoRegion = null);
    Task<List<SolicitudDto>> ListarPorFuncionarioAsync(int funcionarioId);
    Task<SolicitudDto?> ObtenerPorIdAsync(int solicitudId);

    Task<SolicitudDto> RevisarDocumentacionCoordinadorAsync(
        int solicitudId,
        RevisarDocumentacionCoordinadorRequest request,
        string? direccionIp);

    Task<SolicitudDto> EmitirResolucionYActivarPagoAsync(
        int solicitudId,
        EmitirResolucionRequest request,
        string? direccionIp);
}
