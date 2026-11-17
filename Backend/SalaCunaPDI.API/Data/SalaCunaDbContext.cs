using Microsoft.EntityFrameworkCore;
using SalaCunaPDI.API.Models.Entities;

namespace SalaCunaPDI.API.Data;

/// <summary>
/// Contexto de Entity Framework Core mapeado al esquema relacional del Bono Compensatorio de Sala Cuna PDI.
/// Incluye: UsuariosSistema, PresupuestoRegional, Funcionarios, Solicitudes, DocumentosIniciales,
/// Resoluciones, ControlMensual30, EtapasFlujo, HistorialAlertas y AuditoriaSistema.
/// </summary>
public class SalaCunaDbContext : DbContext
{
    public SalaCunaDbContext(DbContextOptions<SalaCunaDbContext> options) : base(options)
    {
    }

    public virtual DbSet<UsuarioSistema> UsuariosSistema { get; set; }
    public virtual DbSet<PresupuestoRegional> PresupuestoRegional { get; set; }
    public virtual DbSet<Funcionario> Funcionarios { get; set; }
    public virtual DbSet<Solicitud> Solicitudes { get; set; }
    public virtual DbSet<DocumentoInicial> DocumentosIniciales { get; set; }
    public virtual DbSet<Resolucion> Resoluciones { get; set; }
    public virtual DbSet<ControlMensual> ControlMensual { get; set; }
    public virtual DbSet<EtapaFlujo> EtapasFlujo { get; set; }
    public virtual DbSet<HistorialAlerta> HistorialAlertas { get; set; }
    public virtual DbSet<AuditoriaSistema> AuditoriaSistema { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. UsuariosSistema
        modelBuilder.Entity<UsuarioSistema>(entity =>
        {
            entity.ToTable("UsuariosSistema");
            entity.HasKey(e => e.UsuarioID);
            entity.Property(e => e.Rut).IsRequired().HasMaxLength(15).IsUnicode(false);
            entity.HasIndex(e => e.Rut).IsUnique();
            entity.Property(e => e.Nombres).IsRequired().HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.Apellidos).IsRequired().HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.Rol).IsRequired().HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.CorreoElectronico).IsRequired().HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(100).IsUnicode(false).HasDefaultValue("123456");
            entity.Property(e => e.Activo).HasDefaultValue(true);
            entity.Property(e => e.FechaCreacion).HasColumnType("datetime").HasDefaultValueSql("(getdate())");
        });

        // 2. PresupuestoRegional (Módulo 4)
        modelBuilder.Entity<PresupuestoRegional>(entity =>
        {
            entity.ToTable("PresupuestoRegional");
            entity.HasKey(e => e.PresupuestoID);
            entity.HasIndex(e => new { e.Anio, e.CodigoRegion }).IsUnique();
            entity.Property(e => e.CodigoRegion).IsRequired().HasMaxLength(10).IsUnicode(false);
            entity.Property(e => e.NombreRegion).IsRequired().HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.PorcentajeAsignado).HasColumnType("decimal(7, 4)");
            entity.Property(e => e.BolsaGlobalAnual).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.MontoAsignadoInicial).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.MontoArrastreAnterior).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.MontoComprometido).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.MontoDevengadoPagado).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.MontoArrastreSiguienteAnio).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.FechaActualizacion).HasColumnType("datetime").HasDefaultValueSql("(getdate())");
        });

        // 3. Funcionarios
        modelBuilder.Entity<Funcionario>(entity =>
        {
            entity.ToTable("Funcionarios");
            entity.HasKey(e => e.FuncionarioID);
            entity.Property(e => e.Rut).IsRequired().HasMaxLength(15).IsUnicode(false);
            entity.HasIndex(e => e.Rut).IsUnique();
            entity.Property(e => e.Nombres).IsRequired().HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.Apellidos).IsRequired().HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.Escalafon).HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.Unidad).HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.CodigoRegion).IsRequired().HasMaxLength(10).IsUnicode(false).HasDefaultValue("RM");
            entity.Property(e => e.NombreRegion).IsRequired().HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.Telefono).HasMaxLength(20).IsUnicode(false);
            entity.Property(e => e.NumeroSide).HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.CorreoElectronico).IsRequired().HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.NombreMenor).HasMaxLength(150).IsUnicode(false);
            entity.Property(e => e.RutMenor).HasMaxLength(15).IsUnicode(false);
            entity.Property(e => e.FechaNacimientoMenor).HasColumnType("date");
            entity.Property(e => e.FechaRegistro).HasColumnType("datetime").HasDefaultValueSql("(getdate())");
        });

        // 4. Solicitudes (Módulo 1)
        modelBuilder.Entity<Solicitud>(entity =>
        {
            entity.ToTable("Solicitudes");
            entity.HasKey(e => e.SolicitudID);
            entity.Property(e => e.CodigoRegion).IsRequired().HasMaxLength(10).IsUnicode(false).HasDefaultValue("RM");
            entity.Property(e => e.MontoMensualBase).HasColumnType("decimal(18, 2)").HasDefaultValue(385000m);
            entity.Property(e => e.CantidadDocumentosRequeridos).HasDefaultValue(5);
            entity.Property(e => e.Estado).IsRequired().HasMaxLength(40).IsUnicode(false).HasDefaultValue("En Postulacion");
            entity.Property(e => e.MotivoRechazoCorrecciones).IsUnicode(false);
            entity.Property(e => e.ObservacionesCoordinador).IsUnicode(false);
            entity.Property(e => e.EnListaPagoActiva).HasDefaultValue(false);
            entity.Property(e => e.FechaSolicitud).HasColumnType("datetime").HasDefaultValueSql("(getdate())");
            entity.Property(e => e.FechaRevisionCoordinador).HasColumnType("datetime");

            entity.HasOne(d => d.Funcionario)
                .WithMany(p => p.Solicitudes)
                .HasForeignKey(d => d.FuncionarioID)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.Coordinador)
                .WithMany(p => p.SolicitudesCoordinadas)
                .HasForeignKey(d => d.CoordinadorID)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        // 5. DocumentosIniciales
        modelBuilder.Entity<DocumentoInicial>(entity =>
        {
            entity.ToTable("DocumentosIniciales");
            entity.HasKey(e => e.DocumentoID);
            entity.Property(e => e.TipoDocumento).IsRequired().HasMaxLength(80).IsUnicode(false);
            entity.Property(e => e.NombreArchivo).IsRequired().HasMaxLength(255).IsUnicode(false);
            entity.Property(e => e.RutaAlmacenamiento).IsRequired().HasMaxLength(500).IsUnicode(false);
            entity.Property(e => e.EstadoDocumento).IsRequired().HasMaxLength(30).IsUnicode(false).HasDefaultValue("Cargado");
            entity.Property(e => e.ObservacionDocumento).HasMaxLength(500).IsUnicode(false);
            entity.Property(e => e.FechaSubida).HasColumnType("datetime").HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Solicitud)
                .WithMany(p => p.DocumentosIniciales)
                .HasForeignKey(d => d.SolicitudID)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        // 6. Resoluciones (Módulo 1)
        modelBuilder.Entity<Resolucion>(entity =>
        {
            entity.ToTable("Resoluciones");
            entity.HasKey(e => e.ResolucionID);
            entity.HasIndex(e => e.SolicitudID).IsUnique();
            entity.HasIndex(e => e.NumeroResolucion).IsUnique();
            entity.Property(e => e.NumeroResolucion).IsRequired().HasMaxLength(80).IsUnicode(false);
            entity.Property(e => e.FechaResolucion).HasColumnType("date");
            entity.Property(e => e.MontoMensualAprobado).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CodigoRegion).IsRequired().HasMaxLength(10).IsUnicode(false);
            entity.Property(e => e.CoordinadorEmisor).IsRequired().HasMaxLength(150).IsUnicode(false);
            entity.Property(e => e.ObservacionesResolucion).IsUnicode(false);
            entity.Property(e => e.ActivoEnListaPago).HasDefaultValue(true);
            entity.Property(e => e.FechaIngresoListaPago).HasColumnType("datetime").HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Solicitud)
                .WithOne(p => p.Resolucion)
                .HasForeignKey<Resolucion>(d => d.SolicitudID)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        // 7. ControlMensual30 (Módulos 2 y 3)
        modelBuilder.Entity<ControlMensual>(entity =>
        {
            entity.ToTable("ControlMensual30");
            entity.HasKey(e => e.ControlID);
            entity.HasIndex(e => new { e.SolicitudID, e.Anio, e.Mes }).IsUnique();

            entity.Property(e => e.FechaNotificacionDia30).HasColumnType("datetime").HasDefaultValueSql("(getdate())");
            entity.Property(e => e.DiasBaseMes).HasDefaultValue(30);
            entity.Property(e => e.DiasEfectivos).HasDefaultValue(30);
            entity.Property(e => e.MontoMensualBase).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.MontoProporcionalCalculado).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.RutaArchivoRespaldo).HasMaxLength(500).IsUnicode(false);
            entity.Property(e => e.EstadoFlujo).IsRequired().HasMaxLength(50).IsUnicode(false).HasDefaultValue("Notificado Dia 30");

            entity.Property(e => e.CoordinadorResponsable).HasMaxLength(150).IsUnicode(false);
            entity.Property(e => e.ObservacionCoordinador).IsUnicode(false);
            entity.Property(e => e.FechaVistoBuenoCoordinador).HasColumnType("datetime");

            entity.Property(e => e.VisadorResponsable).HasMaxLength(150).IsUnicode(false);
            entity.Property(e => e.ObservacionVisador).IsUnicode(false);
            entity.Property(e => e.FechaVisacion).HasColumnType("datetime");

            entity.Property(e => e.LogisticaResponsable).HasMaxLength(150).IsUnicode(false);
            entity.Property(e => e.NumeroCompromisoLogistica).HasMaxLength(80).IsUnicode(false);
            entity.Property(e => e.FechaCompromisoLogistica).HasColumnType("datetime");

            entity.Property(e => e.FinanzasResponsable).HasMaxLength(150).IsUnicode(false);
            entity.Property(e => e.EvaluacionDecofi).HasMaxLength(150).IsUnicode(false);
            entity.Property(e => e.MontoDevengadoFinal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.EsArrastrePresupuestaria).HasColumnName("EsArrastrePresupuestario").HasDefaultValue(false);
            entity.Property(e => e.ComprobanteTesoreria).HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.DocumentoAutorizacionTexto).IsUnicode(false);
            entity.Property(e => e.FechaPagoDefinitivo).HasColumnType("datetime");

            entity.HasOne(d => d.Solicitud)
                .WithMany(p => p.ControlesMensuales)
                .HasForeignKey(d => d.SolicitudID)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.Resolucion)
                .WithMany(p => p.ControlesMensuales)
                .HasForeignKey(d => d.ResolucionID)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.Funcionario)
                .WithMany(p => p.ControlesMensuales)
                .HasForeignKey(d => d.FuncionarioID)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        // 8. EtapasFlujo
        modelBuilder.Entity<EtapaFlujo>(entity =>
        {
            entity.ToTable("EtapasFlujo");
            entity.HasKey(e => e.EtapaFlujoID);
            entity.Property(e => e.NombreEtapa).IsRequired().HasMaxLength(60).IsUnicode(false);
            entity.Property(e => e.AccionRealizada).IsRequired().HasMaxLength(80).IsUnicode(false);
            entity.Property(e => e.EstadoResultante).IsRequired().HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.UsuarioResponsable).IsRequired().HasMaxLength(150).IsUnicode(false);
            entity.Property(e => e.Observaciones).IsUnicode(false);
            entity.Property(e => e.MontoEvaluado).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.FechaEtapa).HasColumnType("datetime").HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.ControlMensual)
                .WithMany(p => p.EtapasFlujo)
                .HasForeignKey(d => d.ControlID)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        // 9. HistorialAlertas
        modelBuilder.Entity<HistorialAlerta>(entity =>
        {
            entity.ToTable("HistorialAlertas");
            entity.HasKey(e => e.AlertaID);
            entity.Property(e => e.FechaAlerta).HasColumnType("datetime").HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Mensaje).IsRequired().IsUnicode(false);
            entity.Property(e => e.EstadoAlerta).HasMaxLength(30).IsUnicode(false).HasDefaultValue("Enviada");

            entity.HasOne(d => d.ControlMensual)
                .WithMany(p => p.HistorialAlertas)
                .HasForeignKey(d => d.ControlID)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        // 10. AuditoriaSistema
        modelBuilder.Entity<AuditoriaSistema>(entity =>
        {
            entity.ToTable("AuditoriaSistema");
            entity.HasKey(e => e.AuditoriaID);
            entity.Property(e => e.UsuarioResponsable).IsRequired().HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.Accion).IsRequired().HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.TablaAfectada).IsRequired().HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.RegistroID).IsRequired();
            entity.Property(e => e.DetalleCambio).IsUnicode(false);
            entity.Property(e => e.DireccionIP).HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.FechaHora).HasColumnType("datetime").HasDefaultValueSql("(getdate())");
        });
    }
}
