using Microsoft.EntityFrameworkCore;
using SalaCunaPDI.API.Data;
using SalaCunaPDI.API.Models.DTOs;
using SalaCunaPDI.API.Models.Entities;
using SalaCunaPDI.API.Services.Interfaces;

namespace SalaCunaPDI.API.Services.Implementations;

public class FuncionarioService : IFuncionarioService
{
    private readonly SalaCunaDbContext _context;
    private readonly IAuditoriaService _auditoriaService;

    private static readonly Dictionary<string, string> RegionesChile = new(StringComparer.OrdinalIgnoreCase)
    {
        ["RM"] = "Región Metropolitana de Santiago",
        ["XV"] = "Región de Arica y Parinacota",
        ["I"] = "Región de Tarapacá",
        ["II"] = "Región de Antofagasta",
        ["III"] = "Región de Atacama",
        ["IV"] = "Región de Coquimbo",
        ["V"] = "Región de Valparaíso",
        ["VI"] = "Región del Libertador Gral. Bernardo O'Higgins",
        ["VII"] = "Región del Maule",
        ["XVI"] = "Región de Ñuble",
        ["VIII"] = "Región del Biobío",
        ["IX"] = "Región de La Araucanía",
        ["XIV"] = "Región de Los Ríos",
        ["X"] = "Región de Los Lagos",
        ["XI"] = "Región de Aysén del Gral. Carlos Ibáñez del Campo",
        ["XII"] = "Región de Magallanes y de la Antártica Chilena"
    };

    public FuncionarioService(SalaCunaDbContext context, IAuditoriaService auditoriaService)
    {
        _context = context;
        _auditoriaService = auditoriaService;
    }

    public async Task<FuncionarioDto?> ObtenerPorRutAsync(string rut)
    {
        if (string.IsNullOrWhiteSpace(rut))
            return null;

        var rutBuscado = rut.Trim();
        var rutSinPuntos = rutBuscado.Replace(".", "");

        var funcionario = await _context.Funcionarios
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.Rut == rutBuscado || f.Rut.Replace(".", "") == rutSinPuntos);

        return funcionario == null ? null : MapToDto(funcionario);
    }

    public async Task<FuncionarioDto?> ObtenerPorIdAsync(int funcionarioId)
    {
        var funcionario = await _context.Funcionarios
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.FuncionarioID == funcionarioId);

        return funcionario == null ? null : MapToDto(funcionario);
    }

    public async Task<List<FuncionarioDto>> ListarTodosAsync()
    {
        var funcionarios = await _context.Funcionarios
            .AsNoTracking()
            .OrderBy(f => f.Apellidos)
            .ThenBy(f => f.Nombres)
            .ToListAsync();

        return funcionarios.Select(MapToDto).ToList();
    }

    public async Task<FuncionarioDto> SincronizarPorRutAsync(
        SincronizarFuncionarioRequest request,
        string? usuarioResponsable,
        string? direccionIp)
    {
        var rutNormalizado = request.Rut.Trim();
        var existente = await _context.Funcionarios
            .FirstOrDefaultAsync(f => f.Rut == rutNormalizado);

        var codigoReg = string.IsNullOrWhiteSpace(request.CodigoRegion) ? "RM" : request.CodigoRegion.Trim().ToUpperInvariant();
        if (!RegionesChile.TryGetValue(codigoReg, out var nombreRegOficial))
        {
            codigoReg = "RM";
            nombreRegOficial = RegionesChile["RM"];
        }

        var nombreRegionFinal = !string.IsNullOrWhiteSpace(request.NombreRegion)
            ? request.NombreRegion.Trim()
            : nombreRegOficial;

        var responsable = string.IsNullOrWhiteSpace(usuarioResponsable) ? "Coordinador" : usuarioResponsable.Trim();

        if (existente == null)
        {
            var nuevo = new Funcionario
            {
                Rut = rutNormalizado,
                Nombres = request.Nombres.Trim(),
                Apellidos = request.Apellidos.Trim(),
                Escalafon = request.Escalafon?.Trim(),
                Unidad = request.Unidad?.Trim(),
                CodigoRegion = codigoReg,
                NombreRegion = nombreRegionFinal,
                Telefono = request.Telefono?.Trim(),
                NumeroSide = request.NumeroSide?.Trim(),
                CorreoElectronico = request.CorreoElectronico.Trim(),
                NombreMenor = request.NombreMenor?.Trim(),
                RutMenor = request.RutMenor?.Trim(),
                FechaNacimientoMenor = request.FechaNacimientoMenor,
                FechaRegistro = DateTime.Now
            };

            _context.Funcionarios.Add(nuevo);
            await _context.SaveChangesAsync();

            await _auditoriaService.RegistrarAsync(
                responsable,
                "ALTA_FUNCIONARIO_PDI",
                "Funcionarios",
                nuevo.FuncionarioID,
                $"Alta institucional PDI de funcionario/a RUT {nuevo.Rut} ({nuevo.Nombres} {nuevo.Apellidos}) | Región: {nuevo.CodigoRegion} | N° SIDE: {nuevo.NumeroSide ?? "N/A"} | Menor: {nuevo.NombreMenor ?? "N/A"}.",
                direccionIp);

            return MapToDto(nuevo);
        }
        else
        {
            existente.Nombres = request.Nombres.Trim();
            existente.Apellidos = request.Apellidos.Trim();
            existente.Escalafon = request.Escalafon?.Trim();
            existente.Unidad = request.Unidad?.Trim();
            existente.CodigoRegion = codigoReg;
            existente.NombreRegion = nombreRegionFinal;
            existente.Telefono = request.Telefono?.Trim();
            existente.NumeroSide = request.NumeroSide?.Trim();
            existente.CorreoElectronico = request.CorreoElectronico.Trim();
            existente.NombreMenor = request.NombreMenor?.Trim();
            existente.RutMenor = request.RutMenor?.Trim();
            existente.FechaNacimientoMenor = request.FechaNacimientoMenor;

            await _context.SaveChangesAsync();

            await _auditoriaService.RegistrarAsync(
                responsable,
                "ACTUALIZAR_FUNCIONARIO_PDI",
                "Funcionarios",
                existente.FuncionarioID,
                $"Actualización de ficha institucional de funcionario/a RUT {existente.Rut} | Región: {existente.CodigoRegion} | N° SIDE: {existente.NumeroSide ?? "N/A"}.",
                direccionIp);

            return MapToDto(existente);
        }
    }

    private static FuncionarioDto MapToDto(Funcionario entity)
    {
        return new FuncionarioDto
        {
            FuncionarioID = entity.FuncionarioID,
            Rut = entity.Rut,
            Nombres = entity.Nombres,
            Apellidos = entity.Apellidos,
            Escalafon = entity.Escalafon,
            Unidad = entity.Unidad,
            CodigoRegion = entity.CodigoRegion,
            NombreRegion = entity.NombreRegion,
            Telefono = entity.Telefono,
            NumeroSide = entity.NumeroSide,
            CorreoElectronico = entity.CorreoElectronico,
            NombreMenor = entity.NombreMenor,
            RutMenor = entity.RutMenor,
            FechaNacimientoMenor = entity.FechaNacimientoMenor,
            FechaRegistro = entity.FechaRegistro
        };
    }
}
