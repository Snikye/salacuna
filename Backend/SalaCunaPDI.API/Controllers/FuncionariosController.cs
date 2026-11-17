using Microsoft.AspNetCore.Mvc;
using SalaCunaPDI.API.Models.DTOs;
using SalaCunaPDI.API.Services.Interfaces;

namespace SalaCunaPDI.API.Controllers;

[ApiController]
[Route("api/funcionarios")]
public class FuncionariosController : ControllerBase
{
    private readonly IFuncionarioService _funcionarioService;

    public FuncionariosController(IFuncionarioService funcionarioService)
    {
        _funcionarioService = funcionarioService;
    }

    /// <summary>
    /// Lista todos los funcionarios registrados en el sistema Sala Cuna PDI.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<FuncionarioDto>>> ListarTodos()
    {
        var lista = await _funcionarioService.ListarTodosAsync();
        return Ok(lista);
    }

    /// <summary>
    /// Consulta un funcionario por su ID interno.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<FuncionarioDto>> ObtenerPorId(int id)
    {
        var funcionario = await _funcionarioService.ObtenerPorIdAsync(id);
        if (funcionario == null)
        {
            return NotFound(new { mensaje = $"No se encontró un funcionario con ID {id}." });
        }

        return Ok(funcionario);
    }

    /// <summary>
    /// Consulta los datos de un funcionario por su RUT.
    /// </summary>
    [HttpGet("rut/{rut}")]
    public async Task<ActionResult<FuncionarioDto>> ObtenerPorRut(string rut)
    {
        var funcionario = await _funcionarioService.ObtenerPorRutAsync(rut);
        if (funcionario == null)
        {
            return NotFound(new { mensaje = $"No se encontró un funcionario con el RUT '{rut}'." });
        }

        return Ok(funcionario);
    }

    /// <summary>
    /// Sincroniza (registra o actualiza) los datos de un funcionario PDI por RUT y registra el evento en Auditoría.
    /// </summary>
    [HttpPost("sincronizar")]
    public async Task<ActionResult<FuncionarioDto>> SincronizarPorRut([FromBody] SincronizarFuncionarioRequest request)
    {
        var usuarioHeader = Request.Headers["X-Usuario-Responsable"].FirstOrDefault();
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var resultado = await _funcionarioService.SincronizarPorRutAsync(request, usuarioHeader, ip);
        return Ok(resultado);
    }
}
