using SalaCunaPDI.API.Models.DTOs;

namespace SalaCunaPDI.API.Services.Interfaces;

public interface IAuditoriaService
{
    Task RegistrarAsync(
        string usuarioResponsable,
        string accion,
        string tablaAfectada,
        int registroId,
        string? detalleCambio = null,
        string? direccionIp = null);

    Task<List<AuditoriaSistemaDto>> ListarAuditoriaAsync(
        string? tablaAfectada = null,
        string? accion = null,
        string? usuarioResponsable = null,
        int limite = 200);
}
