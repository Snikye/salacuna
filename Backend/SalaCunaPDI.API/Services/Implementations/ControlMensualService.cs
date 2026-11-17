using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SalaCunaPDI.API.Data;
using SalaCunaPDI.API.Helpers;
using SalaCunaPDI.API.Models.DTOs;
using SalaCunaPDI.API.Models.Entities;
using SalaCunaPDI.API.Services.Interfaces;

namespace SalaCunaPDI.API.Services.Implementations;

public class ControlMensualService : IControlMensualService
{
    private readonly SalaCunaDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;

    public ControlMensualService(
        SalaCunaDbContext context,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        _context = context;
        _configuration = configuration;
        _environment = environment;
    }

    public async Task<List<ControlMensualDto>> ListarControlesAsync(
        int? anio = null,
        int? mes = null,
        string? estadoFlujo = null,
        int? funcionarioId = null,
        string? codigoRegion = null)
    {
        var query = _context.ControlMensual
            .AsNoTracking()
            .Include(c => c.Solicitud)
            .Include(c => c.Funcionario)
            .Include(c => c.Resolucion)
            .Include(c => c.EtapasFlujo)
            .AsQueryable();

        if (anio.HasValue)
            query = query.Where(c => c.Anio == anio.Value);

        if (mes.HasValue)
            query = query.Where(c => c.Mes == mes.Value);

        if (!string.IsNullOrWhiteSpace(estadoFlujo))
            query = query.Where(c => c.EstadoFlujo == estadoFlujo.Trim());

        if (funcionarioId.HasValue)
            query = query.Where(c => c.FuncionarioID == funcionarioId.Value);

        if (!string.IsNullOrWhiteSpace(codigoRegion))
        {
            var codReg = codigoRegion.Trim().ToUpperInvariant();
            query = query.Where(c => c.Solicitud != null && c.Solicitud.CodigoRegion == codReg);
        }

        var lista = await query
            .OrderByDescending(c => c.Anio)
            .ThenByDescending(c => c.Mes)
            .ThenByDescending(c => c.ControlID)
            .ToListAsync();

        return lista.Select(MapToDto).ToList();
    }

    public async Task<ControlMensualDto?> ObtenerPorIdAsync(int controlId)
    {
        var control = await _context.ControlMensual
            .AsNoTracking()
            .Include(c => c.Solicitud)
            .Include(c => c.Funcionario)
            .Include(c => c.Resolucion)
            .Include(c => c.EtapasFlujo)
            .FirstOrDefaultAsync(c => c.ControlID == controlId);

        return control == null ? null : MapToDto(control);
    }

    /// <summary>
    /// MÓDULO 2: Control Mensual de Asistencia y Licencias (Día 30).
    /// Ejecuta el Procedimiento Almacenado `dbo.sp_RegistrarControlMensual30` para calcular
    /// los días efectivos (base 30 días) y el monto proporcional del Bono Compensatorio.
    /// </summary>
    public async Task<ControlMensualDto> RegistrarDeclaracionDia30Async(
        DeclaracionDia30Request request,
        string? direccionIp)
    {
        if (request.DiasFeriadoLegal < 0 || request.DiasAdministrativos < 0 || request.DiasLicenciaMedica < 0)
        {
            throw new ArgumentException("La cantidad de días de Feriado Legal, Días Administrativos o Licencia Médica no puede ser negativa.");
        }

        if (request.TuvoCausalDescuento &&
            (request.DiasFeriadoLegal + request.DiasAdministrativos + request.DiasLicenciaMedica) <= 0)
        {
            throw new ArgumentException("Al indicar SÍ en uso de causales, debe registrar al menos 1 día en Feriado Legal, Días Administrativos o Licencia Médica.");
        }

        if ((request.DiasFeriadoLegal + request.DiasAdministrativos + request.DiasLicenciaMedica) > 30)
        {
            throw new ArgumentException("La suma de días descontados no puede superar la base mensual de 30 días.");
        }

        var controlExistente = await _context.ControlMensual
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.SolicitudID == request.SolicitudID && c.Anio == request.Anio && c.Mes == request.Mes);

        string? rutaArchivoFinal = controlExistente?.RutaArchivoRespaldo;

        if (request.ArchivoRespaldo != null && request.ArchivoRespaldo.Length > 0)
        {
            PdfFileValidator.ValidatePdfFile(request.ArchivoRespaldo);

            var baseStorage = ObtenerRutaBaseAlmacenamiento();
            var carpetaPeriodo = Path.Combine(
                baseStorage,
                "ControlMensualDia30",
                $"{request.Anio}_{request.Mes:D2}",
                $"Solicitud_{request.SolicitudID}");
            Directory.CreateDirectory(carpetaPeriodo);

            var nombreSanitizado = PdfFileValidator.SanitizeFileName(request.ArchivoRespaldo.FileName);
            var nombreUnico = $"Dia30_{DateTime.Now:yyyyMMddHHmmss}_{Guid.NewGuid():N}_{nombreSanitizado}";
            rutaArchivoFinal = Path.Combine(carpetaPeriodo, nombreUnico);

            await using (var fs = new FileStream(rutaArchivoFinal, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                await request.ArchivoRespaldo.CopyToAsync(fs);
            }
        }

        var responsable = string.IsNullOrWhiteSpace(request.UsuarioResponsable)
            ? "Beneficiaria / Coordinador"
            : request.UsuarioResponsable.Trim();

        try
        {
            await _context.Database.ExecuteSqlRawAsync(
                "EXEC dbo.sp_RegistrarControlMensual30 @SolicitudID, @Anio, @Mes, @TuvoCausalDescuento, @DiasFeriadoLegal, @DiasAdministrativos, @DiasLicenciaMedica, @RutaArchivoRespaldo, @UsuarioResponsable",
                new SqlParameter("@SolicitudID", request.SolicitudID),
                new SqlParameter("@Anio", request.Anio),
                new SqlParameter("@Mes", request.Mes),
                new SqlParameter("@TuvoCausalDescuento", request.TuvoCausalDescuento),
                new SqlParameter("@DiasFeriadoLegal", request.TuvoCausalDescuento ? request.DiasFeriadoLegal : 0),
                new SqlParameter("@DiasAdministrativos", request.TuvoCausalDescuento ? request.DiasAdministrativos : 0),
                new SqlParameter("@DiasLicenciaMedica", request.TuvoCausalDescuento ? request.DiasLicenciaMedica : 0),
                new SqlParameter("@RutaArchivoRespaldo", (object?)rutaArchivoFinal ?? DBNull.Value),
                new SqlParameter("@UsuarioResponsable", responsable));
        }
        catch (SqlException ex)
        {
            throw new InvalidOperationException(ex.Message, ex);
        }

        var actualizado = await _context.ControlMensual
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.SolicitudID == request.SolicitudID && c.Anio == request.Anio && c.Mes == request.Mes)
            ?? throw new InvalidOperationException("Error al recuperar el Control Mensual Día 30 registrado.");

        return await ObtenerPorIdAsync(actualizado.ControlID)
            ?? throw new InvalidOperationException("Error al mapear el Control Mensual Día 30.");
    }

    /// <summary>
    /// MÓDULO 3: Circuito Secuencial (Coordinador -> Visador -> Logística -> Finanzas y Tesorería / DECOFI).
    /// Ejecuta el Procedimiento Almacenado `dbo.sp_AvanzarEtapaCircuito`.
    /// </summary>
    public async Task<ControlMensualDto> AvanzarEtapaCircuitoAsync(
        int controlId,
        AvanzarEtapaCircuitoRequest request,
        string? direccionIp)
    {
        if (string.IsNullOrWhiteSpace(request.NombreResponsable))
        {
            throw new ArgumentException("Debe indicar el nombre del funcionario responsable de la etapa.");
        }

        var etapa = request.RolAccion.Trim().ToUpperInvariant();
        var accion = request.Accion.Trim().ToUpperInvariant();
        bool esArrastre = accion == "ARRASTRE";

        try
        {
            await _context.Database.ExecuteSqlRawAsync(
                "EXEC dbo.sp_AvanzarEtapaCircuito @ControlID, @Etapa, @Accion, @UsuarioResponsable, @Observaciones, @NumeroCompromiso, @EvaluacionDecofi, @EsArrastre, @AnioImputacion, @ComprobanteTesoreria",
                new SqlParameter("@ControlID", controlId),
                new SqlParameter("@Etapa", etapa),
                new SqlParameter("@Accion", accion),
                new SqlParameter("@UsuarioResponsable", request.NombreResponsable.Trim()),
                new SqlParameter("@Observaciones", (object?)request.Observaciones?.Trim() ?? DBNull.Value),
                new SqlParameter("@NumeroCompromiso", (object?)request.NumeroDocumentoCompromiso?.Trim() ?? DBNull.Value),
                new SqlParameter("@EvaluacionDecofi", (object?)request.EvaluacionDecofi?.Trim() ?? DBNull.Value),
                new SqlParameter("@EsArrastre", esArrastre),
                new SqlParameter("@AnioImputacion", (object?)request.AnioArrastreDestino ?? DBNull.Value),
                new SqlParameter("@ComprobanteTesoreria", (object?)request.NumeroDocumentoCompromiso?.Trim() ?? DBNull.Value));
        }
        catch (SqlException ex)
        {
            throw new InvalidOperationException(ex.Message, ex);
        }

        return await ObtenerPorIdAsync(controlId)
            ?? throw new InvalidOperationException("No fue posible recuperar el expediente luego de avanzar la etapa del circuito.");
    }

    public async Task<(Stream FileStream, string FileName)> ObtenerArchivoRespaldoAsync(int controlId)
    {
        var control = await _context.ControlMensual
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.ControlID == controlId)
            ?? throw new KeyNotFoundException($"No se encontró el Control Mensual con ID {controlId}.");

        if (string.IsNullOrWhiteSpace(control.RutaArchivoRespaldo) || !File.Exists(control.RutaArchivoRespaldo))
        {
            throw new FileNotFoundException("El archivo PDF de respaldo mensual no se encuentra en la ruta registrada.");
        }

        var nombreDescarga = Path.GetFileName(control.RutaArchivoRespaldo);
        var stream = new FileStream(control.RutaArchivoRespaldo, FileMode.Open, FileAccess.Read, FileShare.Read);
        return (stream, nombreDescarga);
    }

    private string ObtenerRutaBaseAlmacenamiento()
    {
        var rutaConfigurada = _configuration["StorageSettings:BasePath"];
        if (!string.IsNullOrWhiteSpace(rutaConfigurada))
        {
            return Path.IsPathRooted(rutaConfigurada)
                ? rutaConfigurada
                : Path.Combine(_environment.ContentRootPath, rutaConfigurada);
        }

        return Path.Combine(_environment.ContentRootPath, "Storage");
    }

    private static ControlMensualDto MapToDto(ControlMensual c)
    {
        var etapas = c.EtapasFlujo
            .OrderBy(e => e.EtapaFlujoID)
            .Select(e => new EtapaFlujoDto
            {
                EtapaID = e.EtapaFlujoID,
                ControlID = e.ControlID,
                RolResponsable = e.NombreEtapa,
                NombreResponsable = e.UsuarioResponsable,
                AccionRealizada = e.AccionRealizada,
                EstadoResultante = e.EstadoResultante,
                MontoInvolucrado = e.MontoEvaluado,
                AnioImputacion = c.AnioImputacionPresupuestaria ?? c.Anio,
                EsArrastrePresupuestario = c.EsArrastrePresupuestaria,
                EvaluacionDecofi = c.EvaluacionDecofi,
                Observaciones = e.Observaciones,
                FechaRegistro = e.FechaEtapa ?? DateTime.Now
            })
            .ToList();

        return new ControlMensualDto
        {
            ControlID = c.ControlID,
            SolicitudID = c.SolicitudID,
            FuncionarioID = c.FuncionarioID,
            FuncionarioRut = c.Funcionario?.Rut,
            FuncionarioNombreCompleto = c.Funcionario != null
                ? $"{c.Funcionario.Nombres} {c.Funcionario.Apellidos}".Trim()
                : null,
            FuncionarioUnidad = c.Funcionario?.Unidad,
            FuncionarioEscalafon = c.Funcionario?.Escalafon,
            FuncionarioTelefono = c.Funcionario?.Telefono,
            FuncionarioNumeroSide = c.Funcionario?.NumeroSide,
            FuncionarioCorreo = c.Funcionario?.CorreoElectronico,
            NombreMenor = c.Funcionario?.NombreMenor,
            ResolucionID = c.ResolucionID,
            NumeroResolucion = c.Resolucion?.NumeroResolucion,
            Anio = c.Anio,
            Mes = c.Mes,
            CodigoRegion = c.Solicitud?.CodigoRegion ?? c.Funcionario?.CodigoRegion ?? "RM",
            FechaNotificacionDia30 = c.FechaNotificacionDia30 ?? DateTime.Now,
            TuvoCausalDescuento = c.TuvoCausalDescuento,
            DiasBaseMes = c.DiasBaseMes,
            DiasFeriadoLegal = c.DiasFeriadoLegal,
            DiasAdministrativos = c.DiasAdministrativos,
            DiasLicenciaMedica = c.DiasLicenciaMedica,
            DiasDescontadosTotales = c.DiasDescontadosTotales,
            DiasEfectivos = c.DiasEfectivos,
            MontoMensualBase = c.MontoMensualBase,
            MontoProporcionalCalculado = c.MontoProporcionalCalculado,
            RutaArchivoRespaldo = c.RutaArchivoRespaldo,
            EstadoFlujo = c.EstadoFlujo,
            CoordinadorResponsable = c.CoordinadorResponsable,
            ObservacionCoordinador = c.ObservacionCoordinador,
            FechaVistoBuenoCoordinador = c.FechaVistoBuenoCoordinador,
            VisadorResponsable = c.VisadorResponsable,
            ObservacionVisador = c.ObservacionVisador,
            FechaVisacion = c.FechaVisacion,
            LogisticaResponsable = c.LogisticaResponsable,
            NumeroCompromisoPago = c.NumeroCompromisoLogistica,
            FechaCompromisoLogistica = c.FechaCompromisoLogistica,
            FinanzasResponsable = c.FinanzasResponsable,
            TipoEjecucionFinanzas = c.EsArrastrePresupuestaria ? "Arrastre Presupuestario" : (c.FechaPagoDefinitivo.HasValue ? "Devengo y Pago" : null),
            AnioImputacionPresupuestaria = c.AnioImputacionPresupuestaria,
            EvaluacionDecofi = c.EvaluacionDecofi,
            ComprobanteTesoreria = c.ComprobanteTesoreria ?? c.DocumentoAutorizacionTexto,
            FechaEjecucionFinanzas = c.FechaPagoDefinitivo,
            EtapasFlujo = etapas
        };
    }
}
