using Microsoft.EntityFrameworkCore;
using SalaCunaPDI.API.Data;
using SalaCunaPDI.API.Models.DTOs;
using SalaCunaPDI.API.Models.Entities;
using SalaCunaPDI.API.Services.Interfaces;

namespace SalaCunaPDI.API.Services.Implementations;

public class UsuarioSistemaService : IUsuarioSistemaService
{
    private static readonly string[] RolesValidos =
    {
        "Postulante", "Coordinador", "Visador", "Logistica", "Finanzas", "Tesoreria", "Administrador"
    };

    private readonly SalaCunaDbContext _context;
    private readonly IAuditoriaService _auditoriaService;

    public UsuarioSistemaService(SalaCunaDbContext context, IAuditoriaService auditoriaService)
    {
        _context = context;
        _auditoriaService = auditoriaService;
    }

    public async Task<UsuarioSistemaDto> AutenticarAsync(
        LoginRequest request,
        string? direccionIp)
    {
        var rutNormalizado = NormalizarRut(request.Rut);
        if (string.IsNullOrWhiteSpace(rutNormalizado))
        {
            throw new ArgumentException("Debe ingresar un RUT válido.");
        }

        var usuarios = await _context.UsuariosSistema.ToListAsync();
        var usuario = usuarios.FirstOrDefault(u =>
            string.Equals(NormalizarRut(u.Rut), rutNormalizado, StringComparison.OrdinalIgnoreCase));

        if (usuario == null || !usuario.Activo)
        {
            throw new UnauthorizedAccessException(
                $"El RUT '{request.Rut.Trim()}' no se encuentra registrado o habilitado. Solicite su incorporación al Administrador del Sistema (RUT 18441463-5).");
        }

        var passwordIngresada = request.Password?.Trim() ?? string.Empty;
        if (!string.Equals(usuario.PasswordHash, passwordIngresada, StringComparison.Ordinal))
        {
            throw new UnauthorizedAccessException("La contraseña ingresada es incorrecta.");
        }

        int? funcionarioId = null;

        // Si el usuario tiene rol 'Postulante', asegurar que exista su ficha en la tabla Funcionarios
        if (string.Equals(usuario.Rol, "Postulante", StringComparison.OrdinalIgnoreCase))
        {
            var funcionarios = await _context.Funcionarios.ToListAsync();
            var func = funcionarios.FirstOrDefault(f =>
                string.Equals(NormalizarRut(f.Rut), rutNormalizado, StringComparison.OrdinalIgnoreCase));

            if (func == null)
            {
                func = new Funcionario
                {
                    Rut = usuario.Rut,
                    Nombres = usuario.Nombres,
                    Apellidos = usuario.Apellidos,
                    Escalafon = "Oficial Policial",
                    Unidad = "PDI",
                    CodigoRegion = "RM",
                    NombreRegion = "Región Metropolitana de Santiago",
                    CorreoElectronico = usuario.CorreoElectronico,
                    FechaRegistro = DateTime.Now
                };
                _context.Funcionarios.Add(func);
                await _context.SaveChangesAsync();
            }

            funcionarioId = func.FuncionarioID;
        }

        await _auditoriaService.RegistrarAsync(
            $"{usuario.Nombres} {usuario.Apellidos} ({usuario.Rol})",
            "LOGIN_SISTEMA",
            "UsuariosSistema",
            usuario.UsuarioID,
            $"Inicio de sesión exitoso con RUT {usuario.Rut} y rol '{usuario.Rol}'.",
            direccionIp);

        var dto = MapToDto(usuario);
        dto.FuncionarioID = funcionarioId;
        return dto;
    }

    public async Task<List<UsuarioSistemaDto>> ListarUsuariosAsync(string? rol = null)
    {
        var query = _context.UsuariosSistema.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(rol))
        {
            var rolFiltro = rol.Trim();
            query = query.Where(u => u.Rol == rolFiltro);
        }

        var usuarios = await query
            .OrderBy(u => u.Rol)
            .ThenBy(u => u.Apellidos)
            .ToListAsync();

        return usuarios.Select(MapToDto).ToList();
    }

    public async Task<UsuarioSistemaDto?> ObtenerPorIdAsync(int usuarioId)
    {
        var usuario = await _context.UsuariosSistema
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UsuarioID == usuarioId);

        return usuario == null ? null : MapToDto(usuario);
    }

    public async Task<UsuarioSistemaDto> GuardarUsuarioAsync(
        CrearActualizarUsuarioSistemaRequest request,
        string? usuarioResponsable,
        string? direccionIp)
    {
        var rolNormalizado = RolesValidos.FirstOrDefault(r =>
            string.Equals(r, request.Rol.Trim(), StringComparison.OrdinalIgnoreCase))
            ?? throw new ArgumentException(
                $"El rol '{request.Rol}' no es válido. Roles permitidos: {string.Join(", ", RolesValidos)}.");

        var rutLimpio = NormalizarRutConGuion(request.Rut);
        var todosUsuarios = await _context.UsuariosSistema.ToListAsync();
        var existente = todosUsuarios.FirstOrDefault(u =>
            string.Equals(NormalizarRut(u.Rut), NormalizarRut(rutLimpio), StringComparison.OrdinalIgnoreCase));

        var responsable = string.IsNullOrWhiteSpace(usuarioResponsable) ? "Administrador (18441463-5)" : usuarioResponsable.Trim();
        var claveFinal = !string.IsNullOrWhiteSpace(request.Password) ? request.Password.Trim() : (existente?.PasswordHash ?? "123456");

        var nombresFinal = request.Nombres?.Trim() ?? string.Empty;
        var apellidosFinal = !string.IsNullOrWhiteSpace(request.Apellidos) ? request.Apellidos.Trim() : (existente?.Apellidos ?? "PDI");
        var correoFinal = !string.IsNullOrWhiteSpace(request.CorreoElectronico)
            ? request.CorreoElectronico.Trim()
            : (existente?.CorreoElectronico ?? $"{NormalizarRut(rutLimpio).ToLowerInvariant()}@investigaciones.cl");

        var codReg = string.IsNullOrWhiteSpace(request.CodigoRegion) ? (existente?.CodigoRegion ?? "RM") : request.CodigoRegion.Trim().ToUpperInvariant();
        var nomReg = !string.IsNullOrWhiteSpace(request.NombreRegion) ? request.NombreRegion.Trim() : (codReg == "RM" ? "Región Metropolitana de Santiago" : $"Región {codReg}");

        UsuarioSistema usuarioGuardado;

        if (existente == null)
        {
            var nuevo = new UsuarioSistema
            {
                Rut = rutLimpio,
                Nombres = nombresFinal,
                Apellidos = apellidosFinal,
                Rol = rolNormalizado,
                CodigoRegion = codReg,
                NombreRegion = nomReg,
                CorreoElectronico = correoFinal,
                PasswordHash = claveFinal,
                Activo = true,
                FechaCreacion = DateTime.Now
            };

            _context.UsuariosSistema.Add(nuevo);
            await _context.SaveChangesAsync();
            usuarioGuardado = nuevo;

            await _auditoriaService.RegistrarAsync(
                responsable,
                "CREAR_USUARIO_SISTEMA",
                "UsuariosSistema",
                nuevo.UsuarioID,
                $"Se registró el usuario {nuevo.Nombres} {nuevo.Apellidos} (RUT: {nuevo.Rut}, Región: {nuevo.CodigoRegion}) con rol '{nuevo.Rol}'.",
                direccionIp);
        }
        else
        {
            existente.Rut = rutLimpio;
            existente.Nombres = nombresFinal;
            existente.Apellidos = apellidosFinal;
            existente.Rol = rolNormalizado;
            existente.CodigoRegion = codReg;
            existente.NombreRegion = nomReg;
            existente.CorreoElectronico = correoFinal;
            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                existente.PasswordHash = request.Password.Trim();
            }
            existente.Activo = true;

            await _context.SaveChangesAsync();
            usuarioGuardado = existente;

            await _auditoriaService.RegistrarAsync(
                responsable,
                "ACTUALIZAR_USUARIO_SISTEMA",
                "UsuariosSistema",
                existente.UsuarioID,
                $"Se actualizaron los datos/rol/contraseña del usuario RUT {existente.Rut} a rol '{existente.Rol}' (Región: {existente.CodigoRegion}).",
                direccionIp);
        }

        // Si el rol es 'Postulante', asegurar ficha sincronizada en Funcionarios
        if (string.Equals(rolNormalizado, "Postulante", StringComparison.OrdinalIgnoreCase))
        {
            var funcionarios = await _context.Funcionarios.ToListAsync();
            var funcExistente = funcionarios.FirstOrDefault(f =>
                string.Equals(NormalizarRut(f.Rut), NormalizarRut(rutLimpio), StringComparison.OrdinalIgnoreCase));

            if (funcExistente == null)
            {
                _context.Funcionarios.Add(new Funcionario
                {
                    Rut = rutLimpio,
                    Nombres = nombresFinal,
                    Apellidos = apellidosFinal,
                    Escalafon = "Oficial Policial",
                    Unidad = "PDI",
                    CodigoRegion = codReg,
                    NombreRegion = nomReg,
                    CorreoElectronico = correoFinal,
                    FechaRegistro = DateTime.Now
                });
                await _context.SaveChangesAsync();
            }
        }

        return MapToDto(usuarioGuardado);
    }

    public async Task EliminarUsuarioAsync(
        int usuarioId,
        string? usuarioResponsable,
        string? direccionIp)
    {
        var usuario = await _context.UsuariosSistema
            .FirstOrDefaultAsync(u => u.UsuarioID == usuarioId)
            ?? throw new KeyNotFoundException($"No existe el usuario con ID {usuarioId}.");

        if (NormalizarRut(usuario.Rut) == "184414635")
        {
            throw new InvalidOperationException("No se puede eliminar al Administrador Principal del Sistema (RUT 18441463-5).");
        }

        var rut = usuario.Rut;
        var rol = usuario.Rol;

        _context.UsuariosSistema.Remove(usuario);
        await _context.SaveChangesAsync();

        await _auditoriaService.RegistrarAsync(
            string.IsNullOrWhiteSpace(usuarioResponsable) ? "Administrador" : usuarioResponsable.Trim(),
            "ELIMINAR_USUARIO_SISTEMA",
            "UsuariosSistema",
            usuarioId,
            $"Se eliminó el usuario RUT {rut} (Rol: {rol}).",
            direccionIp);
    }

    private static string NormalizarRut(string? rut)
    {
        if (string.IsNullOrWhiteSpace(rut)) return string.Empty;
        return rut.Trim().Replace(".", "").Replace("-", "").Replace(" ", "").ToUpperInvariant();
    }

    private static string NormalizarRutConGuion(string rut)
    {
        var limpio = NormalizarRut(rut);
        if (limpio.Length < 2) return rut.Trim();
        return $"{limpio[..^1]}-{limpio[^1]}";
    }

    private static UsuarioSistemaDto MapToDto(UsuarioSistema u)
    {
        return new UsuarioSistemaDto
        {
            UsuarioID = u.UsuarioID,
            Rut = u.Rut,
            Nombres = u.Nombres,
            Apellidos = u.Apellidos,
            Rol = u.Rol,
            CodigoRegion = string.IsNullOrWhiteSpace(u.CodigoRegion) ? "RM" : u.CodigoRegion,
            NombreRegion = string.IsNullOrWhiteSpace(u.NombreRegion) ? "Región Metropolitana de Santiago" : u.NombreRegion,
            CorreoElectronico = u.CorreoElectronico,
            Activo = u.Activo,
            FechaCreacion = u.FechaCreacion
        };
    }
}
