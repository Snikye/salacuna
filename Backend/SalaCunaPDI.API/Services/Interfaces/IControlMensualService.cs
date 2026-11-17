using SalaCunaPDI.API.Models.DTOs;

namespace SalaCunaPDI.API.Services.Interfaces;

public interface IControlMensualService
{
    Task<List<ControlMensualDto>> ListarControlesAsync(
        int? anio = null,
        int? mes = null,
        string? estadoFlujo = null,
        int? funcionarioId = null,
        string? codigoRegion = null);

    Task<ControlMensualDto?> ObtenerPorIdAsync(int controlId);

    Task<ControlMensualDto> RegistrarDeclaracionDia30Async(
        DeclaracionDia30Request request,
        string? direccionIp);

    Task<ControlMensualDto> AvanzarEtapaCircuitoAsync(
        int controlId,
        AvanzarEtapaCircuitoRequest request,
        string? direccionIp);

    Task<(Stream FileStream, string FileName)> ObtenerArchivoRespaldoAsync(int controlId);
}
