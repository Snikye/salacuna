using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SalaCunaPDI.API.Data;
using SalaCunaPDI.API.Models.DTOs;
using SalaCunaPDI.API.Models.Entities;
using SalaCunaPDI.API.Services.Interfaces;

namespace SalaCunaPDI.API.Services.Implementations;

public class AlertaContabilidadService : IAlertaContabilidadService
{
    private readonly SalaCunaDbContext _context;
    private readonly IAuditoriaService _auditoriaService;

    public AlertaContabilidadService(SalaCunaDbContext context, IAuditoriaService auditoriaService)
    {
        _context = context;
        _auditoriaService = auditoriaService;
    }

    public async Task<List<HistorialAlertaDto>> GenerarAlertasPendientesAsync(
        string? usuarioResponsable,
        string? direccionIp)
    {
        var controlesObservados = await _context.ControlMensual
            .Include(c => c.Funcionario)
            .Include(c => c.HistorialAlertas)
            .Where(c => c.EstadoFlujo == "Devuelto a Coordinador" || c.EstadoFlujo == "Notificado Dia 30")
            .ToListAsync();

        var nuevasAlertas = new List<HistorialAlerta>();
        var responsable = string.IsNullOrWhiteSpace(usuarioResponsable) ? "Sistema" : usuarioResponsable.Trim();

        foreach (var control in controlesObservados)
        {
            bool tieneAlertaActiva = control.HistorialAlertas.Any(a => a.EstadoAlerta == "Enviada");
            if (!tieneAlertaActiva)
            {
                var nombreFunc = control.Funcionario != null
                    ? $"{control.Funcionario.Nombres} {control.Funcionario.Apellidos} (RUT: {control.Funcionario.Rut})"
                    : $"Funcionario ID {control.FuncionarioID}";

                var alerta = new HistorialAlerta
                {
                    ControlID = control.ControlID,
                    FechaAlerta = DateTime.Now,
                    Mensaje = $"Expediente Día 30 ({control.Mes:D2}/{control.Anio}) de {nombreFunc} requiere gestión de Coordinador (Estado actual: '{control.EstadoFlujo}').",
                    EstadoAlerta = "Enviada"
                };

                _context.HistorialAlertas.Add(alerta);
                nuevasAlertas.Add(alerta);
            }
        }

        if (nuevasAlertas.Count > 0)
        {
            await _context.SaveChangesAsync();

            foreach (var alerta in nuevasAlertas)
            {
                await _auditoriaService.RegistrarAsync(
                    responsable,
                    "GENERAR_ALERTA_FLUJO",
                    "HistorialAlertas",
                    alerta.AlertaID,
                    alerta.Mensaje,
                    direccionIp);
            }
        }

        return await ListarAlertasAsync();
    }

    public async Task<List<HistorialAlertaDto>> ListarAlertasAsync(string? estadoAlerta = null)
    {
        var query = _context.HistorialAlertas
            .AsNoTracking()
            .Include(a => a.ControlMensual)
                .ThenInclude(c => c!.Funcionario)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(estadoAlerta))
        {
            var filtro = estadoAlerta.Trim();
            query = query.Where(a => a.EstadoAlerta == filtro);
        }

        var alertas = await query
            .OrderByDescending(a => a.FechaAlerta)
            .ThenByDescending(a => a.AlertaID)
            .ToListAsync();

        return alertas.Select(MapAlertaToDto).ToList();
    }

    public async Task<HistorialAlertaDto> MarcarAlertaRevisadaAsync(
        int alertaId,
        RevisarAlertaRequest request,
        string? direccionIp)
    {
        var alerta = await _context.HistorialAlertas
            .Include(a => a.ControlMensual)
                .ThenInclude(c => c!.Funcionario)
            .FirstOrDefaultAsync(a => a.AlertaID == alertaId)
            ?? throw new KeyNotFoundException($"No se encontró la alerta con ID {alertaId}.");

        alerta.EstadoAlerta = "Revisada";
        await _context.SaveChangesAsync();

        var responsable = string.IsNullOrWhiteSpace(request.UsuarioResponsable)
            ? "Administrador"
            : request.UsuarioResponsable.Trim();

        await _auditoriaService.RegistrarAsync(
            responsable,
            "REVISAR_ALERTA",
            "HistorialAlertas",
            alerta.AlertaID,
            $"Alerta #{alerta.AlertaID} marcada como 'Revisada'. Detalle: {request.DetalleRevision ?? "Sin detalle adicional"}.",
            direccionIp);

        return MapAlertaToDto(alerta);
    }

    /// <summary>
    /// MÓDULO 4: Obtiene la distribución presupuestaria anual regional (60% RM / 40% 15 Regiones).
    /// </summary>
    public async Task<ResumenPresupuestoAnualDto> ObtenerPresupuestoAnualRegionalAsync(int anio)
    {
        var regiones = await _context.PresupuestoRegional
            .AsNoTracking()
            .Where(p => p.Anio == anio)
            .OrderByDescending(p => p.EsRegionMetropolitana)
            .ThenBy(p => p.PresupuestoID)
            .ToListAsync();

        var dtos = regiones.Select(r => new PresupuestoRegionalDto
        {
            PresupuestoID = r.PresupuestoID,
            Anio = r.Anio,
            CodigoRegion = r.CodigoRegion,
            NombreRegion = r.NombreRegion,
            EsRegionMetropolitana = r.EsRegionMetropolitana,
            PorcentajeAsignado = r.PorcentajeAsignado,
            MontoAsignadoInicial = r.MontoAsignadoInicial,
            MontoArrastreAnterior = r.MontoArrastreAnterior,
            MontoComprometido = r.MontoComprometido,
            MontoDevengadoPagado = r.MontoDevengadoPagado,
            NumeroResolucion = r.NumeroResolucion,
            FechaActualizacion = r.FechaActualizacion
        }).ToList();

        var primerResolucion = dtos.FirstOrDefault(x => !string.IsNullOrEmpty(x.NumeroResolucion))?.NumeroResolucion;

        return new ResumenPresupuestoAnualDto
        {
            Anio = anio,
            NumeroResolucion = primerResolucion,
            BolsaAnualInicialTotal = dtos.Sum(x => x.MontoAsignadoInicial),
            MontoArrastreTotal = dtos.Sum(x => x.MontoArrastreAnterior),
            MontoAsignadoRM = dtos.Where(x => x.EsRegionMetropolitana).Sum(x => x.MontoAsignadoInicial),
            MontoAsignadoRegiones = dtos.Where(x => !x.EsRegionMetropolitana).Sum(x => x.MontoAsignadoInicial),
            TotalComprometido = dtos.Sum(x => x.MontoComprometido),
            TotalDevengadoPagado = dtos.Sum(x => x.MontoDevengadoPagado),
            Regiones = dtos
        };
    }

    /// <summary>
    /// MÓDULO 4: Inicializa o actualiza la bolsa presupuestaria anual ejecutando
    /// `dbo.sp_InicializarPresupuestoAnualRegional` (60% RM y 40% distribuido en las 15 regiones restantes, o monto regional especificado).
    /// </summary>
    public async Task<ResumenPresupuestoAnualDto> InicializarPresupuestoAnualRegionalAsync(
        InicializarPresupuestoAnualRequest request,
        string? direccionIp)
    {
        var responsable = string.IsNullOrWhiteSpace(request.UsuarioResponsable)
            ? "Administrador Sistema PDI"
            : request.UsuarioResponsable.Trim();

        try
        {
            await _context.Database.ExecuteSqlRawAsync(
                "EXEC dbo.sp_InicializarPresupuestoAnualRegional @Anio, @BolsaGlobal, @UsuarioResponsable, @NumeroResolucion, @MontoRegiones",
                new SqlParameter("@Anio", request.Anio),
                new SqlParameter("@BolsaGlobal", request.MontoTotalAnual),
                new SqlParameter("@UsuarioResponsable", responsable),
                new SqlParameter("@NumeroResolucion", (object?)request.NumeroResolucion?.Trim() ?? DBNull.Value),
                new SqlParameter("@MontoRegiones", (object?)request.MontoDesignadoRegiones ?? DBNull.Value));
        }
        catch (SqlException ex)
        {
            throw new InvalidOperationException(ex.Message, ex);
        }

        return await ObtenerPresupuestoAnualRegionalAsync(request.Anio);
    }

    private static HistorialAlertaDto MapAlertaToDto(HistorialAlerta a)
    {
        var func = a.ControlMensual?.Funcionario;
        return new HistorialAlertaDto
        {
            AlertaID = a.AlertaID,
            ControlID = a.ControlID,
            SolicitudID = a.ControlMensual?.SolicitudID,
            FuncionarioID = func?.FuncionarioID,
            FuncionarioRut = func?.Rut,
            FuncionarioNombreCompleto = func != null ? $"{func.Nombres} {func.Apellidos}".Trim() : null,
            FuncionarioUnidad = func?.Unidad,
            Anio = a.ControlMensual?.Anio,
            Mes = a.ControlMensual?.Mes,
            EstadoFlujoControl = a.ControlMensual?.EstadoFlujo,
            DestinatarioRol = "Coordinador",
            FechaAlerta = a.FechaAlerta,
            Mensaje = a.Mensaje,
            EstadoAlerta = a.EstadoAlerta ?? "Enviada"
        };
    }
}
