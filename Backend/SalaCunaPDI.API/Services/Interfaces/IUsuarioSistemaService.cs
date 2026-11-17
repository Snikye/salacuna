using SalaCunaPDI.API.Models.DTOs;

namespace SalaCunaPDI.API.Services.Interfaces;

public interface IUsuarioSistemaService
{
    Task<UsuarioSistemaDto> AutenticarAsync(
        LoginRequest request,
        string? direccionIp);

    Task<List<UsuarioSistemaDto>> ListarUsuariosAsync(string? rol = null);
    Task<UsuarioSistemaDto?> ObtenerPorIdAsync(int usuarioId);
    Task<UsuarioSistemaDto> GuardarUsuarioAsync(
        CrearActualizarUsuarioSistemaRequest request,
        string? usuarioResponsable,
        string? direccionIp);
    Task EliminarUsuarioAsync(
        int usuarioId,
        string? usuarioResponsable,
        string? direccionIp);
}
