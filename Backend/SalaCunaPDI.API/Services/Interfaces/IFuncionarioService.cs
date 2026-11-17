using SalaCunaPDI.API.Models.DTOs;

namespace SalaCunaPDI.API.Services.Interfaces;

public interface IFuncionarioService
{
    Task<FuncionarioDto?> ObtenerPorRutAsync(string rut);
    Task<FuncionarioDto?> ObtenerPorIdAsync(int funcionarioId);
    Task<List<FuncionarioDto>> ListarTodosAsync();
    Task<FuncionarioDto> SincronizarPorRutAsync(
        SincronizarFuncionarioRequest request,
        string? usuarioResponsable,
        string? direccionIp);
}
