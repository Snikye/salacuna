using Microsoft.EntityFrameworkCore;
using SalaCunaPDI.API.Data;
using SalaCunaPDI.API.Models.DTOs;
using SalaCunaPDI.API.Models.Entities;
using SalaCunaPDI.API.Services.Interfaces;

namespace SalaCunaPDI.API.Services.Implementations;

public class AuditoriaService : IAuditoriaService
{
    private readonly SalaCunaDbContext _context;

    public AuditoriaService(SalaCunaDbContext context)
    {
        _context = context;
    }

    public async Task RegistrarAsync(
        string usuarioResponsable,
        string accion,
        string tablaAfectada,
        int registroId,
        string? detalleCambio = null,
        string? direccionIp = null)
    {
        var auditoria = new AuditoriaSistema
        {
            UsuarioResponsable = string.IsNullOrWhiteSpace(usuarioResponsable) ? "Sistema" : usuarioResponsable.Trim(),
            Accion = accion.Trim(),
            TablaAfectada = tablaAfectada.Trim(),
            RegistroID = registroId,
            DetalleCambio = detalleCambio,
            DireccionIP = direccionIp,
            FechaHora = DateTime.Now
        };

        _context.AuditoriaSistema.Add(auditoria);
        await _context.SaveChangesAsync();
    }

    public async Task<List<AuditoriaSistemaDto>> ListarAuditoriaAsync(
        string? tablaAfectada = null,
        string? accion = null,
        string? usuarioResponsable = null,
        int limite = 200)
    {
        var query = _context.AuditoriaSistema.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(tablaAfectada))
        {
            query = query.Where(a => a.TablaAfectada == tablaAfectada);
        }

        if (!string.IsNullOrWhiteSpace(accion))
        {
            query = query.Where(a => a.Accion == accion);
        }

        if (!string.IsNullOrWhiteSpace(usuarioResponsable))
        {
            query = query.Where(a => a.UsuarioResponsable.Contains(usuarioResponsable));
        }

        var take = Math.Clamp(limite, 1, 1000);

        return await query
            .OrderByDescending(a => a.FechaHora)
            .ThenByDescending(a => a.AuditoriaID)
            .Take(take)
            .Select(a => new AuditoriaSistemaDto
            {
                AuditoriaID = a.AuditoriaID,
                UsuarioResponsable = a.UsuarioResponsable,
                Accion = a.Accion,
                TablaAfectada = a.TablaAfectada,
                RegistroID = a.RegistroID,
                DetalleCambio = a.DetalleCambio,
                DireccionIP = a.DireccionIP,
                FechaHora = a.FechaHora
            })
            .ToListAsync();
    }
}
