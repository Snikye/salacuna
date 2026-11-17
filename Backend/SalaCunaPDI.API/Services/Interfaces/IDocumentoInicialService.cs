using SalaCunaPDI.API.Models.DTOs;

namespace SalaCunaPDI.API.Services.Interfaces;

public interface IDocumentoInicialService
{
    Task<DocumentoInicialDto> SubirDocumentoAsync(
        SubirDocumentoInicialRequest request,
        string? direccionIp);

    Task<List<DocumentoInicialDto>> ListarPorSolicitudAsync(int solicitudId);

    Task<(Stream FileStream, string FileName)> ObtenerArchivoParaDescargaAsync(int documentoId);

    Task EliminarDocumentoAsync(
        int documentoId,
        string? usuarioResponsable,
        string? direccionIp);
}
