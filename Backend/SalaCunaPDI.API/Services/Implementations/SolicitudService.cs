using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SalaCunaPDI.API.Data;
using SalaCunaPDI.API.Models.DTOs;
using SalaCunaPDI.API.Models.Entities;
using SalaCunaPDI.API.Services.Interfaces;

namespace SalaCunaPDI.API.Services.Implementations;

public class SolicitudService : ISolicitudService
{
    private readonly SalaCunaDbContext _context;
    private readonly IAuditoriaService _auditoriaService;

    public SolicitudService(SalaCunaDbContext context, IAuditoriaService auditoriaService)
    {
        _context = context;
        _auditoriaService = auditoriaService;
    }

    public async Task<SolicitudDto> CrearSolicitudAsync(
        CrearSolicitudRequest request,
        string? usuarioResponsable,
        string? direccionIp)
    {
        var funcionario = await _context.Funcionarios
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.FuncionarioID == request.FuncionarioID)
            ?? throw new KeyNotFoundException($"No se encontró el funcionario con ID {request.FuncionarioID}.");

        var codigoReg = !string.IsNullOrWhiteSpace(request.CodigoRegion)
            ? request.CodigoRegion.Trim().ToUpperInvariant()
            : funcionario.CodigoRegion;

        var nuevaSolicitud = new Solicitud
        {
            FuncionarioID = request.FuncionarioID,
            CoordinadorID = request.CoordinadorID,
            CodigoRegion = codigoReg,
            MontoMensualBase = request.MontoMensualBase > 0 ? request.MontoMensualBase : 385000m,
            CantidadDocumentosRequeridos = request.CantidadDocumentosRequeridos > 0 ? request.CantidadDocumentosRequeridos : 4,
            FechaSolicitud = DateTime.Now,
            Estado = "En Postulacion",
            ObservacionesCoordinador = request.ObservacionesIniciales?.Trim(),
            EnListaPagoActiva = false
        };

        _context.Solicitudes.Add(nuevaSolicitud);
        await _context.SaveChangesAsync();

        var responsable = string.IsNullOrWhiteSpace(usuarioResponsable) ? "Solicitante" : usuarioResponsable.Trim();

        await _auditoriaService.RegistrarAsync(
            responsable,
            "CREAR_POSTULACION_ETAPA1",
            "Solicitudes",
            nuevaSolicitud.SolicitudID,
            $"Se creó la postulación al Bono Compensatorio de Sala Cuna para {funcionario.Nombres} {funcionario.Apellidos} (RUT: {funcionario.Rut}, Región: {codigoReg}, Documentos requeridos: {nuevaSolicitud.CantidadDocumentosRequeridos}).",
            direccionIp);

        return await ObtenerPorIdAsync(nuevaSolicitud.SolicitudID)
            ?? throw new InvalidOperationException("Error al recuperar la solicitud recién creada.");
    }

    public async Task<List<SolicitudDto>> ListarSolicitudesAsync(string? estado = null, bool? enListaPagoActiva = null, string? codigoRegion = null)
    {
        var query = _context.Solicitudes
            .AsNoTracking()
            .Include(s => s.Funcionario)
            .Include(s => s.Coordinador)
            .Include(s => s.DocumentosIniciales)
            .Include(s => s.Resolucion)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(estado))
        {
            var estadoFiltro = estado.Trim();
            query = query.Where(s => s.Estado == estadoFiltro);
        }

        if (enListaPagoActiva.HasValue)
        {
            query = query.Where(s => s.EnListaPagoActiva == enListaPagoActiva.Value);
        }

        if (!string.IsNullOrWhiteSpace(codigoRegion))
        {
            var codReg = codigoRegion.Trim().ToUpperInvariant();
            query = query.Where(s => s.CodigoRegion == codReg || (s.Funcionario != null && s.Funcionario.CodigoRegion == codReg));
        }

        var solicitudes = await query
            .OrderByDescending(s => s.FechaSolicitud)
            .ThenByDescending(s => s.SolicitudID)
            .ToListAsync();

        return solicitudes.Select(MapToDto).ToList();
    }

    public async Task<List<SolicitudDto>> ListarPendientesAsync(string? codigoRegion = null)
    {
        var query = _context.Solicitudes
            .AsNoTracking()
            .Include(s => s.Funcionario)
            .Include(s => s.Coordinador)
            .Include(s => s.DocumentosIniciales)
            .Include(s => s.Resolucion)
            .Where(s => s.Estado != "En Lista de Pago Activa" && s.Estado != "Beneficio Cancelado");

        if (!string.IsNullOrWhiteSpace(codigoRegion))
        {
            var codReg = codigoRegion.Trim().ToUpperInvariant();
            query = query.Where(s => s.CodigoRegion == codReg || (s.Funcionario != null && s.Funcionario.CodigoRegion == codReg));
        }

        var lista = await query
            .OrderByDescending(s => s.FechaSolicitud)
            .ThenByDescending(s => s.SolicitudID)
            .ToListAsync();
        return lista.Select(MapToDto).ToList();
    }

    public async Task<List<SolicitudDto>> ListarPorFuncionarioAsync(int funcionarioId)
    {
        var solicitudes = await _context.Solicitudes
            .AsNoTracking()
            .Include(s => s.Funcionario)
            .Include(s => s.Coordinador)
            .Include(s => s.DocumentosIniciales)
            .Include(s => s.Resolucion)
            .Where(s => s.FuncionarioID == funcionarioId)
            .OrderByDescending(s => s.FechaSolicitud)
            .ThenByDescending(s => s.SolicitudID)
            .ToListAsync();

        return solicitudes.Select(MapToDto).ToList();
    }

    public async Task<SolicitudDto?> ObtenerPorIdAsync(int solicitudId)
    {
        var solicitud = await _context.Solicitudes
            .AsNoTracking()
            .Include(s => s.Funcionario)
            .Include(s => s.Coordinador)
            .Include(s => s.DocumentosIniciales)
            .Include(s => s.Resolucion)
            .FirstOrDefaultAsync(s => s.SolicitudID == solicitudId);

        return solicitud == null ? null : MapToDto(solicitud);
    }

    /// <summary>
    /// Etapa 1 - Revisión del Coordinador sobre los documentos adjuntos:
    /// Evalúa individualmente cada documento cargado (Aprobado / No Aprobado con observación).
    /// - Si todos los documentos están aprobados -> Avanza a 'En Espera Resolucion'.
    /// - Si uno o más documentos no se aprueban -> 'Rechazada por Coordinador' detallando las observaciones.
    /// </summary>
    public async Task<SolicitudDto> RevisarDocumentacionCoordinadorAsync(
        int solicitudId,
        RevisarDocumentacionCoordinadorRequest request,
        string? direccionIp)
    {
        var solicitud = await _context.Solicitudes
            .Include(s => s.Funcionario)
            .Include(s => s.DocumentosIniciales)
            .FirstOrDefaultAsync(s => s.SolicitudID == solicitudId)
            ?? throw new KeyNotFoundException($"No existe una solicitud con ID {solicitudId}.");

        if (solicitud.DocumentosIniciales.Count == 0)
        {
            throw new InvalidOperationException("La postulante aún no ha cargado documentos para revisar.");
        }

        bool todosAprobados;
        var resumenObservacionesRechazo = new List<string>();

        if (request.EvaluacionesDocumentos != null && request.EvaluacionesDocumentos.Count > 0)
        {
            foreach (var doc in solicitud.DocumentosIniciales)
            {
                var eval = request.EvaluacionesDocumentos.FirstOrDefault(e => e.DocumentoID == doc.DocumentoID);
                if (eval != null)
                {
                    if (eval.Aprobado)
                    {
                        doc.EstadoDocumento = "Validado";
                        doc.ObservacionDocumento = null;
                    }
                    else
                    {
                        if (string.IsNullOrWhiteSpace(eval.Observacion))
                        {
                            throw new ArgumentException(
                                $"Debe ingresar la observación de rechazo para el documento '{doc.TipoDocumento}'.");
                        }

                        doc.EstadoDocumento = "Observado";
                        doc.ObservacionDocumento = eval.Observacion.Trim();
                        resumenObservacionesRechazo.Add($"{doc.TipoDocumento}: {doc.ObservacionDocumento}");
                    }
                }
            }

            todosAprobados = solicitud.DocumentosIniciales.All(d => d.EstadoDocumento == "Validado");
        }
        else
        {
            todosAprobados = request.AprobarDocumentacion;
            if (!todosAprobados && string.IsNullOrWhiteSpace(request.MotivoRechazoCorrecciones))
            {
                throw new ArgumentException(
                    "Para rechazar la documentación, es obligatorio especificar las observaciones.");
            }

            foreach (var doc in solicitud.DocumentosIniciales)
            {
                doc.EstadoDocumento = todosAprobados ? "Validado" : "Observado";
                doc.ObservacionDocumento = todosAprobados ? null : request.MotivoRechazoCorrecciones?.Trim();
            }

            if (!todosAprobados && !string.IsNullOrWhiteSpace(request.MotivoRechazoCorrecciones))
            {
                resumenObservacionesRechazo.Add(request.MotivoRechazoCorrecciones.Trim());
            }
        }

        var estadoAnterior = solicitud.Estado;

        if (request.CoordinadorID.HasValue)
        {
            solicitud.CoordinadorID = request.CoordinadorID.Value;
        }

        solicitud.FechaRevisionCoordinador = DateTime.Now;
        solicitud.ObservacionesCoordinador = request.ObservacionesCoordinador?.Trim();

        if (todosAprobados)
        {
            solicitud.Estado = "En Espera Resolucion";
            solicitud.MotivoRechazoCorrecciones = null;
        }
        else
        {
            solicitud.Estado = "Rechazada por Coordinador";
            var detalleConsolidado = resumenObservacionesRechazo.Count > 0
                ? string.Join(" | ", resumenObservacionesRechazo)
                : request.MotivoRechazoCorrecciones?.Trim();

            solicitud.MotivoRechazoCorrecciones = detalleConsolidado;

            _context.HistorialAlertas.Add(new HistorialAlerta
            {
                ControlID = null,
                FechaAlerta = DateTime.Now,
                Mensaje = $"Postulación #{solicitud.SolicitudID} ({solicitud.Funcionario?.Nombres} {solicitud.Funcionario?.Apellidos}) observada en revisión documental. Correcciones requeridas: {solicitud.MotivoRechazoCorrecciones}",
                EstadoAlerta = "Enviada"
            });
        }

        await _context.SaveChangesAsync();

        var responsable = string.IsNullOrWhiteSpace(request.UsuarioResponsable)
            ? "Coordinador"
            : request.UsuarioResponsable.Trim();

        await _auditoriaService.RegistrarAsync(
            responsable,
            todosAprobados ? "VALIDAR_DOCUMENTACION_ETAPA1" : "RECHAZAR_DOCUMENTACION_ETAPA1",
            "Solicitudes",
            solicitud.SolicitudID,
            $"Revisión documental de Solicitud #{solicitud.SolicitudID}: '{estadoAnterior}' -> '{solicitud.Estado}'. " +
            (todosAprobados
                ? $"Todos los documentos aprobados. En espera de N° de Resolución."
                : $"Observaciones por documento: {solicitud.MotivoRechazoCorrecciones}"),
            direccionIp);

        return await ObtenerPorIdAsync(solicitud.SolicitudID)
            ?? throw new InvalidOperationException("Error al obtener la solicitud revisada.");
    }

    /// <summary>
    /// Etapa 1 - Asociación del Número de Resolución de Aprobación e ingreso formal a la Lista de Pagos Activa
    /// invocando el Procedimiento Almacenado `dbo.sp_EmitirResolucionYActivarPago`.
    /// </summary>
    public async Task<SolicitudDto> EmitirResolucionYActivarPagoAsync(
        int solicitudId,
        EmitirResolucionRequest request,
        string? direccionIp)
    {
        if (string.IsNullOrWhiteSpace(request.NumeroResolucion))
        {
            throw new ArgumentException("Debe ingresar el Número de Resolución de Aprobación.");
        }

        var fechaRes = (request.FechaResolucion ?? DateOnly.FromDateTime(DateTime.Today)).ToDateTime(TimeOnly.MinValue);
        var coordinador = string.IsNullOrWhiteSpace(request.CoordinadorEmisor) ? "Coordinador Bienestar PDI" : request.CoordinadorEmisor.Trim();

        try
        {
            await _context.Database.ExecuteSqlRawAsync(
                "EXEC dbo.sp_EmitirResolucionYActivarPago @SolicitudID, @NumeroResolucion, @FechaResolucion, @MontoMensualAprobado, @CoordinadorEmisor, @Observaciones",
                new SqlParameter("@SolicitudID", solicitudId),
                new SqlParameter("@NumeroResolucion", request.NumeroResolucion.Trim()),
                new SqlParameter("@FechaResolucion", fechaRes),
                new SqlParameter("@MontoMensualAprobado", request.MontoMensualAprobado),
                new SqlParameter("@CoordinadorEmisor", coordinador),
                new SqlParameter("@Observaciones", (object?)request.Observaciones?.Trim() ?? DBNull.Value));
        }
        catch (SqlException ex)
        {
            throw new InvalidOperationException(ex.Message, ex);
        }

        return await ObtenerPorIdAsync(solicitudId)
            ?? throw new InvalidOperationException("No fue posible recuperar la solicitud activada en Lista de Pago.");
    }

    private static SolicitudDto MapToDto(Solicitud s)
    {
        var docs = s.DocumentosIniciales
            .OrderBy(d => d.DocumentoID)
            .Select(d => new DocumentoInicialDto
            {
                DocumentoID = d.DocumentoID,
                SolicitudID = d.SolicitudID,
                TipoDocumento = d.TipoDocumento,
                NombreArchivo = d.NombreArchivo,
                RutaAlmacenamiento = d.RutaAlmacenamiento,
                EstadoDocumento = d.EstadoDocumento,
                ObservacionDocumento = d.ObservacionDocumento,
                FechaSubida = d.FechaSubida
            })
            .ToList();

        ResolucionDto? resolucionDto = null;
        if (s.Resolucion != null)
        {
            resolucionDto = new ResolucionDto
            {
                ResolucionID = s.Resolucion.ResolucionID,
                SolicitudID = s.Resolucion.SolicitudID,
                NumeroResolucion = s.Resolucion.NumeroResolucion,
                FechaResolucion = s.Resolucion.FechaResolucion,
                MontoMensualAprobado = s.Resolucion.MontoMensualAprobado,
                FechaInicioBeneficio = s.Resolucion.FechaResolucion,
                FechaTerminoBeneficio = null,
                EstadoResolucion = s.Resolucion.ActivoEnListaPago ? "Vigente" : "Inactiva",
                CoordinadorEmisor = s.Resolucion.CoordinadorEmisor,
                Observaciones = s.Resolucion.ObservacionesResolucion,
                FechaRegistro = s.Resolucion.FechaIngresoListaPago
            };
        }

        return new SolicitudDto
        {
            SolicitudID = s.SolicitudID,
            FuncionarioID = s.FuncionarioID,
            FuncionarioRut = s.Funcionario?.Rut,
            FuncionarioNombreCompleto = s.Funcionario != null
                ? $"{s.Funcionario.Nombres} {s.Funcionario.Apellidos}".Trim()
                : null,
            FuncionarioUnidad = s.Funcionario?.Unidad,
            FuncionarioEscalafon = s.Funcionario?.Escalafon,
            FuncionarioTelefono = s.Funcionario?.Telefono,
            FuncionarioNumeroSide = s.Funcionario?.NumeroSide,
            FuncionarioCorreo = s.Funcionario?.CorreoElectronico,
            NombreMenor = s.Funcionario?.NombreMenor,
            RutMenor = s.Funcionario?.RutMenor,
            FechaNacimientoMenor = s.Funcionario?.FechaNacimientoMenor,
            CoordinadorID = s.CoordinadorID,
            CoordinadorNombre = s.Coordinador != null
                ? $"{s.Coordinador.Nombres} {s.Coordinador.Apellidos}".Trim()
                : null,
            CodigoRegion = s.CodigoRegion,
            NombreRegion = s.Funcionario?.NombreRegion,
            MontoMensualBase = s.MontoMensualBase,
            CantidadDocumentosRequeridos = s.CantidadDocumentosRequeridos,
            CantidadDocumentosSubidos = docs.Count,
            FechaSolicitud = s.FechaSolicitud,
            Estado = s.Estado,
            MotivoRechazoCorrecciones = s.MotivoRechazoCorrecciones,
            ObservacionesCoordinador = s.ObservacionesCoordinador,
            FechaRevisionCoordinador = s.FechaRevisionCoordinador,
            FechaIngresoListaPago = s.Resolucion?.FechaIngresoListaPago,
            EnListaPagoActiva = s.EnListaPagoActiva,
            Resolucion = resolucionDto,
            DocumentosIniciales = docs
        };
    }
}
