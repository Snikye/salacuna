using Microsoft.AspNetCore.Mvc;
using SalaCunaPDI.API.Models.DTOs;
using SalaCunaPDI.API.Services.Interfaces;

namespace SalaCunaPDI.API.Controllers;

[ApiController]
[Route("api/usuarios-sistema")]
public class UsuariosSistemaController : ControllerBase
{
    private readonly IUsuarioSistemaService _usuarioService;

    public UsuariosSistemaController(IUsuarioSistemaService usuarioService)
    {
        _usuarioService = usuarioService;
    }

    /// <summary>
    /// Autentica un usuario por RUT y Contraseña devolviendo su perfil, rol y FuncionarioID asociado.
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<UsuarioSistemaDto>> Login([FromBody] LoginRequest request)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var usuario = await _usuarioService.AutenticarAsync(request, ip);
        return Ok(usuario);
    }

    /// <summary>
    /// Lista los usuarios registrados en el sistema con filtro opcional por rol.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<UsuarioSistemaDto>>> Listar([FromQuery] string? rol = null)
    {
        var usuarios = await _usuarioService.ListarUsuariosAsync(rol);
        return Ok(usuarios);
    }

    /// <summary>
    /// Obtiene un usuario del sistema por su ID.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<UsuarioSistemaDto>> ObtenerPorId(int id)
    {
        var usuario = await _usuarioService.ObtenerPorIdAsync(id);
        if (usuario == null)
        {
            return NotFound(new { mensaje = $"No existe el usuario con ID {id}." });
        }
        return Ok(usuario);
    }

    /// <summary>
    /// Crea o actualiza un usuario del sistema por RUT asignándole su rol operativo y contraseña.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<UsuarioSistemaDto>> Guardar([FromBody] CrearActualizarUsuarioSistemaRequest request)
    {
        var usuarioResponsable = Request.Headers["X-Usuario-Responsable"].FirstOrDefault();
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var guardado = await _usuarioService.GuardarUsuarioAsync(request, usuarioResponsable, ip);
        return Ok(guardado);
    }

    /// <summary>
    /// Elimina un usuario del sistema por ID.
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var usuarioResponsable = Request.Headers["X-Usuario-Responsable"].FirstOrDefault();
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        await _usuarioService.EliminarUsuarioAsync(id, usuarioResponsable, ip);
        return NoContent();
    }
}
