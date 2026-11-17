-- ==========================================================================================
-- SISTEMA DE GESTIÓN "BONO COMPENSATORIO DE SALA CUNA" - JEFATURA DE BIENESTAR PDI
-- Script Integral: Creación de BD, Esquema Relacional (MER), Restricciones, 
-- Procedimientos Almacenados y Datos Semilla para Despliegue en Cualquier Servidor
-- ==========================================================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'SalaCunaPDI')
BEGIN
    CREATE DATABASE [SalaCunaPDI];
END
GO

USE [SalaCunaPDI];
GO

-- 1. Limpieza ordenada de objetos previos si ya existen en la BD
IF OBJECT_ID('dbo.sp_AvanzarEtapaCircuito', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_AvanzarEtapaCircuito;
IF OBJECT_ID('dbo.sp_RegistrarControlMensual30', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_RegistrarControlMensual30;
IF OBJECT_ID('dbo.sp_EmitirResolucionYActivarPago', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_EmitirResolucionYActivarPago;
IF OBJECT_ID('dbo.sp_InicializarPresupuestoAnualRegional', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_InicializarPresupuestoAnualRegional;
GO

IF OBJECT_ID('dbo.HistorialAlertas', 'U') IS NOT NULL DROP TABLE dbo.HistorialAlertas;
IF OBJECT_ID('dbo.EtapasFlujo', 'U') IS NOT NULL DROP TABLE dbo.EtapasFlujo;
IF OBJECT_ID('dbo.ControlMensual30', 'U') IS NOT NULL DROP TABLE dbo.ControlMensual30;
IF OBJECT_ID('dbo.ControlMensual', 'U') IS NOT NULL DROP TABLE dbo.ControlMensual;
IF OBJECT_ID('dbo.Resoluciones', 'U') IS NOT NULL DROP TABLE dbo.Resoluciones;
IF OBJECT_ID('dbo.DocumentosIniciales', 'U') IS NOT NULL DROP TABLE dbo.DocumentosIniciales;
IF OBJECT_ID('dbo.Solicitudes', 'U') IS NOT NULL DROP TABLE dbo.Solicitudes;
IF OBJECT_ID('dbo.PresupuestoRegional', 'U') IS NOT NULL DROP TABLE dbo.PresupuestoRegional;
IF OBJECT_ID('dbo.Funcionarios', 'U') IS NOT NULL DROP TABLE dbo.Funcionarios;
IF OBJECT_ID('dbo.UsuariosSistema', 'U') IS NOT NULL DROP TABLE dbo.UsuariosSistema;
IF OBJECT_ID('dbo.AuditoriaSistema', 'U') IS NOT NULL DROP TABLE dbo.AuditoriaSistema;
GO

-- 2. Tabla de Usuarios y Roles del Sistema (Con Contraseña y Región para Control de Acceso Regional)
CREATE TABLE UsuariosSistema (
    UsuarioID INT IDENTITY(1,1) PRIMARY KEY,
    Rut VARCHAR(15) NOT NULL UNIQUE,
    Nombres VARCHAR(100) NOT NULL,
    Apellidos VARCHAR(100) NOT NULL,
    Rol VARCHAR(50) NOT NULL, -- 'Postulante', 'Coordinador', 'Visador', 'Logistica', 'Finanzas', 'Tesoreria', 'Administrador'
    CodigoRegion VARCHAR(10) NOT NULL DEFAULT 'RM',
    NombreRegion VARCHAR(100) NOT NULL DEFAULT 'Región Metropolitana de Santiago',
    CorreoElectronico VARCHAR(100) NOT NULL,
    PasswordHash VARCHAR(100) NOT NULL DEFAULT '123456',
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME DEFAULT GETDATE()
);
GO

-- 3. Tabla de Distribución Presupuestaria Anual Regional (MÓDULO 4: 60% RM / 40% Regiones)
CREATE TABLE PresupuestoRegional (
    PresupuestoID INT IDENTITY(1,1) PRIMARY KEY,
    Anio INT NOT NULL,
    CodigoRegion VARCHAR(10) NOT NULL,
    NombreRegion VARCHAR(100) NOT NULL,
    EsRegionMetropolitana BIT NOT NULL DEFAULT 0,
    PorcentajeAsignado DECIMAL(7,4) NOT NULL,
    BolsaGlobalAnual DECIMAL(18,2) NOT NULL,
    MontoAsignadoInicial DECIMAL(18,2) NOT NULL,
    MontoArrastreAnterior DECIMAL(18,2) NOT NULL DEFAULT 0,
    MontoComprometido DECIMAL(18,2) NOT NULL DEFAULT 0,
    MontoDevengadoPagado DECIMAL(18,2) NOT NULL DEFAULT 0,
    MontoArrastreSiguienteAnio DECIMAL(18,2) NOT NULL DEFAULT 0,
    FechaActualizacion DATETIME DEFAULT GETDATE(),
    CONSTRAINT UQ_PresupuestoRegional_AnioRegion UNIQUE (Anio, CodigoRegion)
);
GO

-- 4. Tabla de Funcionarios / Beneficiarias PDI
CREATE TABLE Funcionarios (
    FuncionarioID INT IDENTITY(1,1) PRIMARY KEY,
    Rut VARCHAR(15) NOT NULL UNIQUE,
    Nombres VARCHAR(100) NOT NULL,
    Apellidos VARCHAR(100) NOT NULL,
    Escalafon VARCHAR(50) NULL,
    Unidad VARCHAR(100) NULL,
    CodigoRegion VARCHAR(10) NOT NULL DEFAULT 'RM',
    NombreRegion VARCHAR(100) NOT NULL DEFAULT 'Región Metropolitana de Santiago',
    Telefono VARCHAR(20) NULL,
    NumeroSide VARCHAR(50) NULL,
    CorreoElectronico VARCHAR(100) NOT NULL,
    NombreMenor VARCHAR(150) NULL,
    RutMenor VARCHAR(15) NULL,
    FechaNacimientoMenor DATE NULL,
    FechaRegistro DATETIME DEFAULT GETDATE()
);
GO

-- 5. Tabla de Solicitudes de Postulación al Bono Compensatorio (MÓDULO 1)
CREATE TABLE Solicitudes (
    SolicitudID INT IDENTITY(1,1) PRIMARY KEY,
    FuncionarioID INT NOT NULL FOREIGN KEY REFERENCES Funcionarios(FuncionarioID),
    CoordinadorID INT NULL FOREIGN KEY REFERENCES UsuariosSistema(UsuarioID),
    CodigoRegion VARCHAR(10) NOT NULL DEFAULT 'RM',
    MontoMensualBase DECIMAL(18,2) NOT NULL DEFAULT 385000.00,
    CantidadDocumentosRequeridos INT NOT NULL DEFAULT 4,
    Estado VARCHAR(40) NOT NULL DEFAULT 'En Postulacion',
        -- 'En Postulacion', 'En Revision Coordinador', 'Rechazada por Coordinador',
        -- 'En Espera Resolucion', 'En Lista de Pago Activa', 'Beneficio Cancelado'
    MotivoRechazoCorrecciones VARCHAR(MAX) NULL,
    ObservacionesCoordinador VARCHAR(MAX) NULL,
    EnListaPagoActiva BIT NOT NULL DEFAULT 0,
    FechaSolicitud DATETIME DEFAULT GETDATE(),
    FechaRevisionCoordinador DATETIME NULL
);
GO

-- 6. Tabla de Documentos Requeridos Adjuntos a la Postulación (MÓDULO 1)
CREATE TABLE DocumentosIniciales (
    DocumentoID INT IDENTITY(1,1) PRIMARY KEY,
    SolicitudID INT NOT NULL FOREIGN KEY REFERENCES Solicitudes(SolicitudID),
    TipoDocumento VARCHAR(80) NOT NULL,
    NombreArchivo VARCHAR(255) NOT NULL,
    RutaAlmacenamiento VARCHAR(500) NOT NULL,
    EstadoDocumento VARCHAR(30) NOT NULL DEFAULT 'Cargado', -- 'Cargado', 'Observado', 'Validado'
    ObservacionDocumento VARCHAR(500) NULL,
    FechaSubida DATETIME DEFAULT GETDATE()
);
GO

-- 7. Tabla de Resoluciones de Aprobación e Ingreso a Lista de Pago (MÓDULO 1)
CREATE TABLE Resoluciones (
    ResolucionID INT IDENTITY(1,1) PRIMARY KEY,
    SolicitudID INT NOT NULL UNIQUE FOREIGN KEY REFERENCES Solicitudes(SolicitudID),
    NumeroResolucion VARCHAR(80) NOT NULL UNIQUE,
    FechaResolucion DATE NOT NULL,
    MontoMensualAprobado DECIMAL(18,2) NOT NULL,
    CodigoRegion VARCHAR(10) NOT NULL,
    CoordinadorEmisor VARCHAR(150) NOT NULL,
    ObservacionesResolucion VARCHAR(MAX) NULL,
    ActivoEnListaPago BIT NOT NULL DEFAULT 1,
    FechaIngresoListaPago DATETIME DEFAULT GETDATE()
);
GO

-- 8. Tabla de Control Mensual Día 30 y Circuito de Visación/Logística/Finanzas (MÓDULOS 2 y 3)
CREATE TABLE ControlMensual30 (
    ControlID INT IDENTITY(1,1) PRIMARY KEY,
    SolicitudID INT NOT NULL FOREIGN KEY REFERENCES Solicitudes(SolicitudID),
    ResolucionID INT NULL FOREIGN KEY REFERENCES Resoluciones(ResolucionID),
    FuncionarioID INT NOT NULL FOREIGN KEY REFERENCES Funcionarios(FuncionarioID),
    Anio INT NOT NULL,
    Mes INT NOT NULL CHECK (Mes BETWEEN 1 AND 12),
    FechaNotificacionDia30 DATETIME DEFAULT GETDATE(),

    -- MÓDULO 2: Declaración Día 30 (SÍ / NO uso de causales) y cálculo proporcional sobre base 30 días
    TuvoCausalDescuento BIT NOT NULL DEFAULT 0, -- 0 = NO (30 días completos), 1 = SÍ (descuenta días)
    DiasBaseMes INT NOT NULL DEFAULT 30 CHECK (DiasBaseMes = 30),
    DiasFeriadoLegal INT NOT NULL DEFAULT 0 CHECK (DiasFeriadoLegal >= 0 AND DiasFeriadoLegal <= 30),
    DiasAdministrativos INT NOT NULL DEFAULT 0 CHECK (DiasAdministrativos >= 0 AND DiasAdministrativos <= 30),
    DiasLicenciaMedica INT NOT NULL DEFAULT 0 CHECK (DiasLicenciaMedica >= 0 AND DiasLicenciaMedica <= 30),
    DiasDescontadosTotales INT NOT NULL DEFAULT 0 CHECK (DiasDescontadosTotales >= 0 AND DiasDescontadosTotales <= 30),
    DiasEfectivos INT NOT NULL DEFAULT 30 CHECK (DiasEfectivos >= 0 AND DiasEfectivos <= 30),

    MontoMensualBase DECIMAL(18,2) NOT NULL,
    MontoProporcionalCalculado DECIMAL(18,2) NOT NULL,
    RutaArchivoRespaldo VARCHAR(500) NULL,

    -- MÓDULO 3: Estado en el Circuito Secuencial
    EstadoFlujo VARCHAR(50) NOT NULL DEFAULT 'Notificado Dia 30',
        -- 'Notificado Dia 30'
        -- 'Visto Bueno Coordinador'
        -- 'Beneficio Cancelado'
        -- 'Devuelto a Coordinador'
        -- 'Visado Conforme'
        -- 'Compromiso Logistica'
        -- 'Pagado Finanzas'
        -- 'Arrastre Presupuestario'

    -- Etapa 1 Circuito: Coordinador
    CoordinadorResponsable VARCHAR(150) NULL,
    ObservacionCoordinador VARCHAR(MAX) NULL,
    FechaVistoBuenoCoordinador DATETIME NULL,

    -- Etapa 2 Circuito: Visador
    VisadorResponsable VARCHAR(150) NULL,
    ObservacionVisador VARCHAR(MAX) NULL,
    FechaVisacion DATETIME NULL,

    -- Etapa 3 Circuito: Logística
    LogisticaResponsable VARCHAR(150) NULL,
    NumeroCompromisoLogistica VARCHAR(80) NULL,
    FechaCompromisoLogistica DATETIME NULL,

    -- Etapa 4 Circuito: Finanzas, Tesorería y Evaluación DECOFI
    FinanzasResponsable VARCHAR(150) NULL,
    EvaluacionDecofi VARCHAR(150) NULL,
    MontoDevengadoFinal DECIMAL(18,2) NULL,
    EsArrastrePresupuestario BIT NOT NULL DEFAULT 0,
    AnioImputacionPresupuestaria INT NULL,
    ComprobanteTesoreria VARCHAR(100) NULL,
    DocumentoAutorizacionTexto VARCHAR(MAX) NULL,
    FechaPagoDefinitivo DATETIME NULL,

    CONSTRAINT UQ_ControlMensual30_SolicitudPeriodo UNIQUE (SolicitudID, Anio, Mes)
);
GO

-- 9. Tabla de Historial Secuencial de Etapas del Flujo (MÓDULO 3)
CREATE TABLE EtapasFlujo (
    EtapaFlujoID INT IDENTITY(1,1) PRIMARY KEY,
    ControlID INT NOT NULL FOREIGN KEY REFERENCES ControlMensual30(ControlID),
    NombreEtapa VARCHAR(60) NOT NULL,
    AccionRealizada VARCHAR(80) NOT NULL,
    EstadoResultante VARCHAR(50) NOT NULL,
    UsuarioResponsable VARCHAR(150) NOT NULL,
    Observaciones VARCHAR(MAX) NULL,
    MontoEvaluado DECIMAL(18,2) NULL,
    FechaEtapa DATETIME DEFAULT GETDATE()
);
GO

-- 10. Tabla de Alertas Automáticas
CREATE TABLE HistorialAlertas (
    AlertaID INT IDENTITY(1,1) PRIMARY KEY,
    ControlID INT NULL FOREIGN KEY REFERENCES ControlMensual30(ControlID),
    FechaAlerta DATETIME DEFAULT GETDATE(),
    Mensaje VARCHAR(MAX) NOT NULL,
    EstadoAlerta VARCHAR(30) DEFAULT 'Enviada'
);
GO

-- 11. Tabla de Auditoría Transversal
CREATE TABLE AuditoriaSistema (
    AuditoriaID INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioResponsable VARCHAR(100) NOT NULL,
    Accion VARCHAR(100) NOT NULL,
    TablaAfectada VARCHAR(50) NOT NULL,
    RegistroID INT NOT NULL,
    DetalleCambio VARCHAR(MAX) NULL,
    DireccionIP VARCHAR(50) NULL,
    FechaHora DATETIME DEFAULT GETDATE()
);
GO

-- ==========================================================================================
-- PROCEDIMIENTOS ALMACENADOS TRANSACCIONALES CLAVE
-- ==========================================================================================

-- SP 1: Inicialización y Distribución Presupuestaria Anual Regional (Resolución, Bolsa Global y Asignación Regiones)
CREATE PROCEDURE dbo.sp_InicializarPresupuestoAnualRegional
    @Anio INT,
    @BolsaGlobal DECIMAL(18,2) = 60000000.00,
    @UsuarioResponsable VARCHAR(100) = 'Sistema',
    @NumeroResolucion VARCHAR(100) = NULL,
    @MontoRegiones DECIMAL(18,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Si no se especifica MontoRegiones, se aplica el 40% por defecto ($24.000.000 para bolsa de 60M)
        DECLARE @BolsaRegionesRestantes DECIMAL(18,2) = ISNULL(@MontoRegiones, ROUND(@BolsaGlobal * 0.40, 2));
        DECLARE @MontoRM DECIMAL(18,2) = @BolsaGlobal - @BolsaRegionesRestantes; -- 60%
        DECLARE @MontoPorRegion DECIMAL(18,2) = ROUND(@BolsaRegionesRestantes / 15.0, 2);
        DECLARE @PorcentajePorRegion DECIMAL(7,4) = CASE WHEN @BolsaGlobal > 0 THEN ROUND((@BolsaRegionesRestantes / @BolsaGlobal * 100.0) / 15.0, 4) ELSE 2.6667 END;
        DECLARE @PorcentajeRM DECIMAL(7,4) = CASE WHEN @BolsaGlobal > 0 THEN ROUND((@MontoRM / @BolsaGlobal) * 100.0, 4) ELSE 60.0000 END;

        DECLARE @Regiones TABLE (
            Codigo VARCHAR(10),
            Nombre VARCHAR(100),
            EsRM BIT
        );

        INSERT INTO @Regiones (Codigo, Nombre, EsRM) VALUES
            ('RM',   'Región Metropolitana de Santiago', 1),
            ('XV',   'Región de Arica y Parinacota', 0),
            ('I',    'Región de Tarapacá', 0),
            ('II',   'Región de Antofagasta', 0),
            ('III',  'Región de Atacama', 0),
            ('IV',   'Región de Coquimbo', 0),
            ('V',    'Región de Valparaíso', 0),
            ('VI',   'Región del Libertador Gral. Bernardo O''Higgins', 0),
            ('VII',  'Región del Maule', 0),
            ('XVI',  'Región de Ñuble', 0),
            ('VIII', 'Región del Biobío', 0),
            ('IX',   'Región de La Araucanía', 0),
            ('XIV',  'Región de Los Ríos', 0),
            ('X',    'Región de Los Lagos', 0),
            ('XI',   'Región de Aysén del Gral. Carlos Ibáñez del Campo', 0),
            ('XII',  'Región de Magallanes y de la Antártica Chilena', 0);

        MERGE dbo.PresupuestoRegional AS target
        USING (
            SELECT
                @Anio AS Anio,
                r.Codigo AS CodigoRegion,
                r.Nombre AS NombreRegion,
                r.EsRM AS EsRegionMetropolitana,
                CASE WHEN r.EsRM = 1 THEN @PorcentajeRM ELSE @PorcentajePorRegion END AS PorcentajeAsignado,
                @BolsaGlobal AS BolsaGlobalAnual,
                CASE WHEN r.EsRM = 1 THEN @MontoRM ELSE @MontoPorRegion END AS MontoAsignadoInicial,
                ISNULL((
                    SELECT TOP 1 pAnt.MontoArrastreSiguienteAnio
                    FROM dbo.PresupuestoRegional pAnt
                    WHERE pAnt.Anio = (@Anio - 1) AND pAnt.CodigoRegion = r.Codigo
                ), 0) AS ArrastrePrevio,
                @NumeroResolucion AS NumeroResolucion
            FROM @Regiones r
        ) AS src
        ON (target.Anio = src.Anio AND target.CodigoRegion = src.CodigoRegion)
        WHEN MATCHED THEN
            UPDATE SET
                target.BolsaGlobalAnual = src.BolsaGlobalAnual,
                target.PorcentajeAsignado = src.PorcentajeAsignado,
                target.MontoAsignadoInicial = src.MontoAsignadoInicial,
                target.NumeroResolucion = ISNULL(src.NumeroResolucion, target.NumeroResolucion),
                target.FechaActualizacion = GETDATE()
        WHEN NOT MATCHED THEN
            INSERT (Anio, CodigoRegion, NombreRegion, EsRegionMetropolitana, PorcentajeAsignado,
                    BolsaGlobalAnual, MontoAsignadoInicial, MontoArrastreAnterior, MontoComprometido,
                    MontoDevengadoPagado, MontoArrastreSiguienteAnio, NumeroResolucion, FechaActualizacion)
            VALUES (src.Anio, src.CodigoRegion, src.NombreRegion, src.EsRegionMetropolitana, src.PorcentajeAsignado,
                    src.BolsaGlobalAnual, src.MontoAsignadoInicial, src.ArrastrePrevio, 0, 0, 0, src.NumeroResolucion, GETDATE());

        INSERT INTO dbo.AuditoriaSistema (UsuarioResponsable, Accion, TablaAfectada, RegistroID, DetalleCambio, FechaHora)
        VALUES (@UsuarioResponsable, 'INICIALIZAR_PRESUPUESTO_ANUAL', 'PresupuestoRegional', @Anio,
                CONCAT('Bolsa Anual Año ', @Anio, ' (Res: ', ISNULL(@NumeroResolucion, 'N/A'), ') por $', FORMAT(@BolsaGlobal, 'N0', 'es-CL'), ' - RM: $', FORMAT(@MontoRM, 'N0', 'es-CL'), ', Regiones: $', FORMAT(@BolsaRegionesRestantes, 'N0', 'es-CL')),
                GETDATE());

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- SP 2: Emitir Resolución de Aprobación e Ingresar a Lista de Pago Activa (MÓDULO 1)
CREATE PROCEDURE dbo.sp_EmitirResolucionYActivarPago
    @SolicitudID INT,
    @NumeroResolucion VARCHAR(80),
    @FechaResolucion DATE,
    @MontoMensualAprobado DECIMAL(18,2),
    @CoordinadorEmisor VARCHAR(150),
    @Observaciones VARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @CodigoRegion VARCHAR(10);
        DECLARE @CantDocs INT;
        DECLARE @CantObservados INT;

        SELECT
            @CodigoRegion = s.CodigoRegion,
            @CantDocs = (SELECT COUNT(1) FROM dbo.DocumentosIniciales d WHERE d.SolicitudID = s.SolicitudID),
            @CantObservados = (SELECT COUNT(1) FROM dbo.DocumentosIniciales d WHERE d.SolicitudID = s.SolicitudID AND d.EstadoDocumento = 'Observado')
        FROM dbo.Solicitudes s
        WHERE s.SolicitudID = @SolicitudID;

        IF @CodigoRegion IS NULL
            THROW 50001, 'La solicitud indicada no existe.', 1;

        IF @CantDocs = 0
            THROW 50002, 'No se puede emitir la Resolución porque la postulante aún no ha cargado documentos.', 1;

        IF @CantObservados > 0
            THROW 50003, 'No se puede emitir la Resolución mientras existan documentos observados/no aprobados.', 1;

        DECLARE @ResolucionID INT;
        SELECT @ResolucionID = ResolucionID 
        FROM dbo.Resoluciones 
        WHERE SolicitudID = @SolicitudID;

        IF @ResolucionID IS NOT NULL
        BEGIN
            UPDATE dbo.Resoluciones
            SET NumeroResolucion = @NumeroResolucion,
                FechaResolucion = @FechaResolucion,
                MontoMensualAprobado = @MontoMensualAprobado,
                CodigoRegion = @CodigoRegion,
                CoordinadorEmisor = @CoordinadorEmisor,
                ObservacionesResolucion = @Observaciones,
                ActivoEnListaPago = 1,
                FechaIngresoListaPago = GETDATE()
            WHERE ResolucionID = @ResolucionID;

            INSERT INTO dbo.AuditoriaSistema (UsuarioResponsable, Accion, TablaAfectada, RegistroID, DetalleCambio, FechaHora)
            VALUES (@CoordinadorEmisor, 'ACTUALIZAR_RESOLUCION_PAGO', 'Resoluciones', @ResolucionID,
                    CONCAT('Resolución N° ', @NumeroResolucion, ' actualizada para Solicitud #', @SolicitudID, '. Lista de Pago Activa por $', FORMAT(@MontoMensualAprobado, 'N0', 'es-CL')),
                    GETDATE());
        END
        ELSE
        BEGIN
            INSERT INTO dbo.Resoluciones (
                SolicitudID, NumeroResolucion, FechaResolucion, MontoMensualAprobado,
                CodigoRegion, CoordinadorEmisor, ObservacionesResolucion, ActivoEnListaPago, FechaIngresoListaPago
            )
            VALUES (
                @SolicitudID, @NumeroResolucion, @FechaResolucion, @MontoMensualAprobado,
                @CodigoRegion, @CoordinadorEmisor, @Observaciones, 1, GETDATE()
            );

            SET @ResolucionID = SCOPE_IDENTITY();

            INSERT INTO dbo.AuditoriaSistema (UsuarioResponsable, Accion, TablaAfectada, RegistroID, DetalleCambio, FechaHora)
            VALUES (@CoordinadorEmisor, 'EMITIR_RESOLUCION_INGRESO_PAGO', 'Resoluciones', @ResolucionID,
                    CONCAT('Resolución N° ', @NumeroResolucion, ' emitida para Solicitud #', @SolicitudID, '. Ingresa a Lista de Pago Activa por $', FORMAT(@MontoMensualAprobado, 'N0', 'es-CL')),
                    GETDATE());
        END

        UPDATE dbo.Solicitudes
        SET Estado = 'En Lista de Pago Activa',
            MontoMensualBase = @MontoMensualAprobado,
            EnListaPagoActiva = 1,
            ObservacionesCoordinador = ISNULL(@Observaciones, ObservacionesCoordinador),
            FechaRevisionCoordinador = GETDATE()
        WHERE SolicitudID = @SolicitudID;

        INSERT INTO dbo.AuditoriaSistema (UsuarioResponsable, Accion, TablaAfectada, RegistroID, DetalleCambio, FechaHora)
        VALUES (@CoordinadorEmisor, 'EMITIR_RESOLUCION_INGRESO_PAGO', 'Resoluciones', @ResolucionID,
                CONCAT('Resolución N° ', @NumeroResolucion, ' emitida para Solicitud #', @SolicitudID, '. Ingresa a Lista de Pago Activa por $', FORMAT(@MontoMensualAprobado, 'N0', 'es-CL')),
                GETDATE());

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- SP 3: Registro de Notificación Mensual Día 30 y Cálculo Proporcional sobre 30 Días (MÓDULO 2)
CREATE PROCEDURE dbo.sp_RegistrarControlMensual30
    @SolicitudID INT,
    @Anio INT,
    @Mes INT,
    @TuvoCausalDescuento BIT,
    @DiasFeriadoLegal INT = 0,
    @DiasAdministrativos INT = 0,
    @DiasLicenciaMedica INT = 0,
    @RutaArchivoRespaldo VARCHAR(500) = NULL,
    @UsuarioResponsable VARCHAR(150) = 'Beneficiaria'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF @DiasFeriadoLegal < 0 OR @DiasAdministrativos < 0 OR @DiasLicenciaMedica < 0
            THROW 50010, 'No se permiten valores negativos en los días de Feriado Legal, Días Administrativos o Licencia Médica.', 1;

        DECLARE @FuncionarioID INT, @ResolucionID INT, @MontoBase DECIMAL(18,2), @EnListaActiva BIT;

        SELECT
            @FuncionarioID = s.FuncionarioID,
            @MontoBase = ISNULL(r.MontoMensualAprobado, s.MontoMensualBase),
            @ResolucionID = r.ResolucionID,
            @EnListaActiva = s.EnListaPagoActiva
        FROM dbo.Solicitudes s
        LEFT JOIN dbo.Resoluciones r ON r.SolicitudID = s.SolicitudID
        WHERE s.SolicitudID = @SolicitudID;

        IF @FuncionarioID IS NULL
            THROW 50011, 'La solicitud indicada no existe.', 1;

        IF @EnListaActiva = 0
            THROW 50012, 'La solicitud aún no cuenta con Resolución activa en la Lista de Pago.', 1;

        IF @TuvoCausalDescuento = 0
        BEGIN
            SET @DiasFeriadoLegal = 0;
            SET @DiasAdministrativos = 0;
            SET @DiasLicenciaMedica = 0;
        END

        DECLARE @DiasDescontados INT = @DiasFeriadoLegal + @DiasAdministrativos + @DiasLicenciaMedica;

        IF @TuvoCausalDescuento = 1 AND @DiasDescontados = 0
            THROW 50013, 'Si declara haber hecho uso de causal (SÍ), debe indicar al menos 1 día en Feriado Legal, Días Administrativos o Licencia Médica.', 1;

        IF @DiasDescontados > 30
            THROW 50014, 'La suma de días descontados (Feriado Legal + Administrativos + Licencia Médica) no puede superar la base de 30 días del mes.', 1;

        DECLARE @DiasEfectivos INT = 30 - @DiasDescontados;
        DECLARE @MontoProporcional DECIMAL(18,2) = ROUND((@MontoBase / 30.0) * @DiasEfectivos, 0);

        DECLARE @ControlID INT;
        SELECT @ControlID = ControlID
        FROM dbo.ControlMensual30
        WHERE SolicitudID = @SolicitudID AND Anio = @Anio AND Mes = @Mes;

        IF @ControlID IS NULL
        BEGIN
            INSERT INTO dbo.ControlMensual30 (
                SolicitudID, ResolucionID, FuncionarioID, Anio, Mes, FechaNotificacionDia30,
                TuvoCausalDescuento, DiasBaseMes, DiasFeriadoLegal, DiasAdministrativos, DiasLicenciaMedica,
                DiasDescontadosTotales, DiasEfectivos, MontoMensualBase, MontoProporcionalCalculado,
                RutaArchivoRespaldo, EstadoFlujo
            )
            VALUES (
                @SolicitudID, @ResolucionID, @FuncionarioID, @Anio, @Mes, GETDATE(),
                @TuvoCausalDescuento, 30, @DiasFeriadoLegal, @DiasAdministrativos, @DiasLicenciaMedica,
                @DiasDescontados, @DiasEfectivos, @MontoBase, @MontoProporcional,
                @RutaArchivoRespaldo, 'Notificado Dia 30'
            );
            SET @ControlID = SCOPE_IDENTITY();
        END
        ELSE
        BEGIN
            UPDATE dbo.ControlMensual30
            SET TuvoCausalDescuento = @TuvoCausalDescuento,
                DiasFeriadoLegal = @DiasFeriadoLegal,
                DiasAdministrativos = @DiasAdministrativos,
                DiasLicenciaMedica = @DiasLicenciaMedica,
                DiasDescontadosTotales = @DiasDescontados,
                DiasEfectivos = @DiasEfectivos,
                MontoMensualBase = @MontoBase,
                MontoProporcionalCalculado = @MontoProporcional,
                RutaArchivoRespaldo = ISNULL(@RutaArchivoRespaldo, RutaArchivoRespaldo),
                EstadoFlujo = 'Notificado Dia 30',
                FechaNotificacionDia30 = GETDATE()
            WHERE ControlID = @ControlID;
        END

        INSERT INTO dbo.EtapasFlujo (ControlID, NombreEtapa, AccionRealizada, EstadoResultante, UsuarioResponsable, Observaciones, MontoEvaluado, FechaEtapa)
        VALUES (@ControlID, 'Declaracion Dia 30',
                CASE WHEN @TuvoCausalDescuento = 1 THEN 'Declaración con Causales de Descuento' ELSE 'Declaración 30 Días Completos (Sin Causal)' END,
                'Notificado Dia 30', @UsuarioResponsable,
                CONCAT('Días Efectivos: ', @DiasEfectivos, '/30 (Feriado=', @DiasFeriadoLegal, ', Admin=', @DiasAdministrativos, ', Licencia=', @DiasLicenciaMedica, ')'),
                @MontoProporcional, GETDATE());

        INSERT INTO dbo.AuditoriaSistema (UsuarioResponsable, Accion, TablaAfectada, RegistroID, DetalleCambio, FechaHora)
        VALUES (@UsuarioResponsable, 'NOTIFICACION_DIA_30', 'ControlMensual30', @ControlID,
                CONCAT('Período ', @Mes, '/', @Anio, ' - Días efectivos: ', @DiasEfectivos, '/30 - Monto proporcional: $', FORMAT(@MontoProporcional, 'N0', 'es-CL')),
                GETDATE());

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- SP 4: Circuito Secuencial de Visación, Logística, Finanzas/DECOFI y Control Presupuestario Regional (MÓDULOS 3 y 4)
CREATE PROCEDURE dbo.sp_AvanzarEtapaCircuito
    @ControlID INT,
    @Etapa VARCHAR(40),               -- 'COORDINADOR', 'VISADOR', 'LOGISTICA', 'FINANZAS'
    @Accion VARCHAR(40),              -- 'VISTO_BUENO', 'CANCELAR_BENEFICIO', 'APROBAR', 'DEVOLVER', 'COMPROMETER', 'DEVENGAR_PAGAR', 'ARRASTRE'
    @UsuarioResponsable VARCHAR(150),
    @Observaciones VARCHAR(MAX) = NULL,
    @NumeroCompromiso VARCHAR(80) = NULL,
    @EvaluacionDecofi VARCHAR(150) = NULL,
    @EsArrastre BIT = 0,
    @AnioImputacion INT = NULL,
    @ComprobanteTesoreria VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @SolicitudID INT, @FuncionarioID INT, @Anio INT, @Mes INT, @MontoCalculado DECIMAL(18,2);
        DECLARE @CodigoRegion VARCHAR(10), @NombreFunc VARCHAR(200), @RutFunc VARCHAR(15);

        SELECT
            @SolicitudID = c.SolicitudID,
            @FuncionarioID = c.FuncionarioID,
            @Anio = c.Anio,
            @Mes = c.Mes,
            @MontoCalculado = c.MontoProporcionalCalculado,
            @CodigoRegion = ISNULL(s.CodigoRegion, 'RM'),
            @NombreFunc = CONCAT(f.Nombres, ' ', f.Apellidos),
            @RutFunc = f.Rut
        FROM dbo.ControlMensual30 c
        INNER JOIN dbo.Solicitudes s ON s.SolicitudID = c.SolicitudID
        INNER JOIN dbo.Funcionarios f ON f.FuncionarioID = c.FuncionarioID
        WHERE c.ControlID = @ControlID;

        IF @SolicitudID IS NULL
            THROW 50020, 'El registro de ControlMensual30 indicado no existe.', 1;

        DECLARE @NuevoEstado VARCHAR(50);

        -- 1. ETAPA COORDINADOR
        IF @Etapa = 'COORDINADOR'
        BEGIN
            IF @Accion = 'CANCELAR_BENEFICIO'
            BEGIN
                SET @NuevoEstado = 'Beneficio Cancelado';
                UPDATE dbo.Solicitudes SET Estado = 'Beneficio Cancelado', EnListaPagoActiva = 0 WHERE SolicitudID = @SolicitudID;
                UPDATE dbo.Resoluciones SET ActivoEnListaPago = 0 WHERE SolicitudID = @SolicitudID;
            END
            ELSE
            BEGIN
                SET @NuevoEstado = 'Visto Bueno Coordinador';
            END

            UPDATE dbo.ControlMensual30
            SET EstadoFlujo = @NuevoEstado,
                CoordinadorResponsable = @UsuarioResponsable,
                ObservacionCoordinador = @Observaciones,
                FechaVistoBuenoCoordinador = GETDATE()
            WHERE ControlID = @ControlID;
        END

        -- 2. ETAPA VISADOR
        ELSE IF @Etapa = 'VISADOR'
        BEGIN
            IF @Accion = 'DEVOLVER'
            BEGIN
                IF @Observaciones IS NULL OR LTRIM(RTRIM(@Observaciones)) = ''
                    THROW 50021, 'Para devolver el expediente al Coordinador debe especificar las observaciones.', 1;
                SET @NuevoEstado = 'Devuelto a Coordinador';

                INSERT INTO dbo.HistorialAlertas (ControlID, FechaAlerta, Mensaje, EstadoAlerta)
                VALUES (@ControlID, GETDATE(), CONCAT('Expediente ', @Mes, '/', @Anio, ' de ', @NombreFunc, ' devuelto por Visador: ', @Observaciones), 'Enviada');
            END
            ELSE
            BEGIN
                SET @NuevoEstado = 'Visado Conforme';
            END

            UPDATE dbo.ControlMensual30
            SET EstadoFlujo = @NuevoEstado,
                VisadorResponsable = @UsuarioResponsable,
                ObservacionVisador = @Observaciones,
                FechaVisacion = GETDATE()
            WHERE ControlID = @ControlID;
        END

        -- 3. ETAPA LOGÍSTICA (Compromiso de Pago y Control de Sobregiro Regional)
        ELSE IF @Etapa = 'LOGISTICA'
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM dbo.PresupuestoRegional WHERE Anio = @Anio AND CodigoRegion = @CodigoRegion)
            BEGIN
                EXEC dbo.sp_InicializarPresupuestoAnualRegional @Anio = @Anio, @BolsaGlobal = 60000000.00, @UsuarioResponsable = @UsuarioResponsable;
            END

            DECLARE @DisponibleRegion DECIMAL(18,2);
            SELECT @DisponibleRegion = (MontoAsignadoInicial + MontoArrastreAnterior) - (MontoComprometido + MontoDevengadoPagado)
            FROM dbo.PresupuestoRegional
            WHERE Anio = @Anio AND CodigoRegion = @CodigoRegion;

            IF @DisponibleRegion < @MontoCalculado
                THROW 50022, 'Sobregiro detectado: El saldo presupuestario disponible en la región es insuficiente para asumir este compromiso de pago.', 1;

            UPDATE dbo.PresupuestoRegional
            SET MontoComprometido = MontoComprometido + @MontoCalculado,
                FechaActualizacion = GETDATE()
            WHERE Anio = @Anio AND CodigoRegion = @CodigoRegion;

            SET @NuevoEstado = 'Compromiso Logistica';

            UPDATE dbo.ControlMensual30
            SET EstadoFlujo = @NuevoEstado,
                LogisticaResponsable = @UsuarioResponsable,
                NumeroCompromisoLogistica = ISNULL(@NumeroCompromiso, CONCAT('COMP-LOG-', @Anio, '-', @ControlID)),
                FechaCompromisoLogistica = GETDATE()
            WHERE ControlID = @ControlID;
        END

        -- 4. ETAPA FINANZAS Y EVALUACIÓN DECOFI (Devengo Vigente o Arrastre Presupuestario -> Deriva a Tesorería)
        ELSE IF @Etapa = 'FINANZAS'
        BEGIN
            DECLARE @AnioDestino INT = ISNULL(@AnioImputacion, CASE WHEN @EsArrastre = 1 THEN @Anio + 1 ELSE @Anio END);

            IF @EsArrastre = 1
            BEGIN
                SET @NuevoEstado = 'Arrastre Presupuestario';

                -- Mover de Comprometido en @Anio a Arrastre hacia @AnioDestino
                UPDATE dbo.PresupuestoRegional
                SET MontoComprometido = CASE WHEN MontoComprometido >= @MontoCalculado THEN MontoComprometido - @MontoCalculado ELSE 0 END,
                    MontoArrastreSiguienteAnio = MontoArrastreSiguienteAnio + @MontoCalculado,
                    FechaActualizacion = GETDATE()
                WHERE Anio = @Anio AND CodigoRegion = @CodigoRegion;

                IF NOT EXISTS (SELECT 1 FROM dbo.PresupuestoRegional WHERE Anio = @AnioDestino AND CodigoRegion = @CodigoRegion)
                BEGIN
                    EXEC dbo.sp_InicializarPresupuestoAnualRegional @Anio = @AnioDestino, @BolsaGlobal = 60000000.00, @UsuarioResponsable = @UsuarioResponsable;
                END

                UPDATE dbo.PresupuestoRegional
                SET MontoArrastreAnterior = MontoArrastreAnterior + @MontoCalculado,
                    MontoComprometido = MontoComprometido + @MontoCalculado,
                    FechaActualizacion = GETDATE()
                WHERE Anio = @AnioDestino AND CodigoRegion = @CodigoRegion;
            END
            ELSE
            BEGIN
                SET @NuevoEstado = 'Devengado Finanzas';
            END

            UPDATE dbo.ControlMensual30
            SET EstadoFlujo = @NuevoEstado,
                FinanzasResponsable = @UsuarioResponsable,
                EvaluacionDecofi = ISNULL(@EvaluacionDecofi, CASE WHEN @EsArrastre = 1 THEN 'Evaluado DECOFI - Arrastre Interanual Autorizado (Derivado a Tesorería)' ELSE 'Evaluado DECOFI - Devengo Autorizado (Derivado a Tesorería)' END),
                MontoDevengadoFinal = @MontoCalculado,
                EsArrastrePresupuestario = @EsArrastre,
                AnioImputacionPresupuestaria = @AnioDestino
            WHERE ControlID = @ControlID;
        END

        -- 5. ETAPA TESORERÍA (Pago Efectivo Final y Emisión de Comprobante de Transferencia)
        ELSE IF @Etapa = 'TESORERIA'
        BEGIN
            DECLARE @AnioPago INT;
            DECLARE @EsArrastreActual BIT;

            SELECT
                @AnioPago = ISNULL(AnioImputacionPresupuestaria, Anio),
                @EsArrastreActual = EsArrastrePresupuestario
            FROM dbo.ControlMensual30
            WHERE ControlID = @ControlID;

            SET @NuevoEstado = 'Pagado Tesoreria';

            UPDATE dbo.PresupuestoRegional
            SET MontoComprometido = CASE WHEN MontoComprometido >= @MontoCalculado THEN MontoComprometido - @MontoCalculado ELSE 0 END,
                MontoDevengadoPagado = MontoDevengadoPagado + @MontoCalculado,
                FechaActualizacion = GETDATE()
            WHERE Anio = @AnioPago AND CodigoRegion = @CodigoRegion;

            DECLARE @TextoAutorizacion VARCHAR(MAX) = CONCAT(
                'Se ejecuta y certifica pago en Tesorería a ', @NombreFunc, ' RUT ', @RutFunc,
                ' por un monto de $', FORMAT(@MontoCalculado, 'N0', 'es-CL'),
                CASE WHEN @EsArrastreActual = 1 THEN CONCAT(' (Imputación Arrastre Presupuestario DECOFI ', @Anio, ' -> ', @AnioPago, ')') ELSE '' END,
                '. Comprobante: ', ISNULL(@ComprobanteTesoreria, CONCAT('TES-PDI-', @AnioPago, '-', @ControlID)),
                '. Atentamente ', @UsuarioResponsable
            );

            UPDATE dbo.ControlMensual30
            SET EstadoFlujo = @NuevoEstado,
                ComprobanteTesoreria = ISNULL(@ComprobanteTesoreria, CONCAT('TES-PDI-', @AnioPago, '-', @ControlID)),
                DocumentoAutorizacionTexto = @TextoAutorizacion,
                FechaPagoDefinitivo = GETDATE()
            WHERE ControlID = @ControlID;
        END

        INSERT INTO dbo.EtapasFlujo (ControlID, NombreEtapa, AccionRealizada, EstadoResultante, UsuarioResponsable, Observaciones, MontoEvaluado, FechaEtapa)
        VALUES (@ControlID, @Etapa, @Accion, @NuevoEstado, @UsuarioResponsable, @Observaciones, @MontoCalculado, GETDATE());

        INSERT INTO dbo.AuditoriaSistema (UsuarioResponsable, Accion, TablaAfectada, RegistroID, DetalleCambio, FechaHora)
        VALUES (@UsuarioResponsable, CONCAT(@Etapa, '_', @Accion), 'ControlMensual30', @ControlID,
                CONCAT('Transición a estado "', @NuevoEstado, '". Monto: $', FORMAT(@MontoCalculado, 'N0', 'es-CL'), '. Obs: ', ISNULL(@Observaciones, 'S/O')),
                GETDATE());

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- Insertar Usuarios Iniciales por Rol y Región (incluyendo Administrador, RM y Regiones)
INSERT INTO dbo.UsuariosSistema (Rut, Nombres, Apellidos, Rol, CodigoRegion, NombreRegion, CorreoElectronico, PasswordHash, Activo) VALUES
    ('18441463-5', 'Administrador',     'General PDI',       'Administrador', 'RM',   'Región Metropolitana de Santiago', 'admin.salacuna@investigaciones.cl',     '123456', 1),
    ('15432198-K', 'Carolina Andrea',   'Soto Valdés',       'Postulante',    'RM',   'Región Metropolitana de Santiago', 'csoto.postulante@investigaciones.cl',   '123456', 1),
    ('14222333-4', 'Marcela Paz',       'Rojas Fuentes',     'Coordinador',   'RM',   'Región Metropolitana de Santiago', 'mrojas.coordinacion@investigaciones.cl','123456', 1),
    ('13555666-7', 'Rodrigo Andrés',    'Tapia Muñoz',       'Visador',       'RM',   'Región Metropolitana de Santiago', 'rtapia.visacion@investigaciones.cl',    '123456', 1),
    ('12888999-0', 'Patricio Esteban',  'Gómez Vera',        'Logistica',     'RM',   'Región Metropolitana de Santiago', 'pgomez.logistica@investigaciones.cl',   '123456', 1),
    ('11444777-K', 'Claudia Alejandra', 'Mendoza Silva',     'Finanzas',      'RM',   'Región Metropolitana de Santiago', 'cmendoza.finanzas@investigaciones.cl',  '123456', 1),
    ('10999888-1', 'Roberto Carlos',    'Pizarro Lagos',     'Tesoreria',     'RM',   'Región Metropolitana de Santiago', 'rpizarro.tesoreria@investigaciones.cl', '123456', 1),
    -- Región de Valparaíso (V)
    ('14222333-5', 'Valeria Paz',       'Castro Soto',       'Coordinador',   'V',    'Región de Valparaíso',             'vcastro.v@investigaciones.cl',          '123456', 1),
    ('13555666-8', 'Héctor Andrés',     'Morales Silva',     'Visador',       'V',    'Región de Valparaíso',             'hmorales.v@investigaciones.cl',         '123456', 1),
    ('12888999-1', 'Sebastián Esteban', 'Díaz Palma',        'Logistica',     'V',    'Región de Valparaíso',             'sdiaz.v@investigaciones.cl',            '123456', 1),
    ('11444777-5', 'Lorena Alejandra',  'Ortiz Fuentes',     'Finanzas',      'V',    'Región de Valparaíso',             'lortiz.v@investigaciones.cl',           '123456', 1),
    ('10999888-5', 'Gonzalo Carlos',    'Reyes Peña',        'Tesoreria',     'V',    'Región de Valparaíso',             'greyes.v@investigaciones.cl',           '123456', 1),
    ('16555444-3', 'Daniela Paz',       'Herrera Muñoz',     'Postulante',    'V',    'Región de Valparaíso',             'dherrera.v@investigaciones.cl',         '123456', 1),
    -- Región del Biobío (VIII)
    ('14222333-8', 'Mauricio Andrés',   'Sanhueza Lira',     'Coordinador',   'VIII', 'Región del Biobío',                'msanhueza.viii@investigaciones.cl',     '123456', 1),
    ('13555666-9', 'Viviana Rocío',     'Lara Ruiz',         'Visador',       'VIII', 'Región del Biobío',                'vlara.viii@investigaciones.cl',         '123456', 1),
    ('17666555-2', 'Camila Andrea',     'Riquelme Soto',     'Postulante',    'VIII', 'Región del Biobío',                'criquelme.viii@investigaciones.cl',     '123456', 1);
GO

-- Insertar Funcionarios / Postulantes con datos de menores y fechas de nacimiento para emulación de los 2 años
INSERT INTO dbo.Funcionarios (Rut, Nombres, Apellidos, Escalafon, Unidad, CodigoRegion, NombreRegion, Telefono, NumeroSide, CorreoElectronico, NombreMenor, RutMenor, FechaNacimientoMenor) VALUES
    ('15432198-K', 'Carolina Andrea', 'Soto Valdés',   'Oficial Policial', 'JENAFAM',               'RM',   'Región Metropolitana de Santiago', '+56 9 8765 4321', 'SIDE-2026-00458', 'csoto.postulante@investigaciones.cl', 'Mateo Ignacio Soto',   '28111222-3', '2024-03-15'),
    ('16555444-3', 'Daniela Paz',     'Herrera Muñoz', 'Asistente Policial', 'BRICRIM Viña del Mar', 'V',    'Región de Valparaíso',             '+56 9 7654 3210', 'SIDE-2026-00892', 'dherrera.v@investigaciones.cl',       'Joaquín Andrés Herrera', '29222333-4', '2025-05-14'),
    ('17666555-2', 'Camila Andrea',   'Riquelme Soto', 'Profesional Perito', 'LACRIM Concepción',    'VIII', 'Región del Biobío',                '+56 9 6543 2109', 'SIDE-2026-01044', 'criquelme.viii@investigaciones.cl',   'Emilia Paz Riquelme',    '29555666-5', '2025-08-20');
GO

-- Inicializar Presupuesto Regional Anual para 2026 ($60.000.000) y 2027 ($60.000.000)
EXEC dbo.sp_InicializarPresupuestoAnualRegional @Anio = 2026, @BolsaGlobal = 60000000.00, @UsuarioResponsable = 'Sistema';
EXEC dbo.sp_InicializarPresupuestoAnualRegional @Anio = 2027, @BolsaGlobal = 60000000.00, @UsuarioResponsable = 'Sistema';
GO

-- Insertar Solicitud y 4 Documentos Iniciales para Carolina Soto (Ingresada a Lista de Pago Activa)
DECLARE @FuncID_RM INT = (SELECT FuncionarioID FROM dbo.Funcionarios WHERE Rut = '15432198-K');
DECLARE @CoordID_RM INT = (SELECT UsuarioID FROM dbo.UsuariosSistema WHERE Rut = '14222333-4');

INSERT INTO dbo.Solicitudes (FuncionarioID, CoordinadorID, CodigoRegion, MontoMensualBase, CantidadDocumentosRequeridos, Estado, EnListaPagoActiva, FechaSolicitud, FechaRevisionCoordinador)
VALUES (@FuncID_RM, @CoordID_RM, 'RM', 385000.00, 4, 'En Lista de Pago Activa', 1, '2026-01-10', '2026-01-15');

DECLARE @SolID_RM INT = SCOPE_IDENTITY();

-- 4 Documentos Oficiales requeridos (O.G. N° 2551 / O.G. N° 874)
INSERT INTO dbo.DocumentosIniciales (SolicitudID, TipoDocumento, NombreArchivo, RutaAlmacenamiento, EstadoDocumento, ObservacionDocumento, FechaSubida) VALUES
    (@SolID_RM, 'Solicitud Dirigida al Director General', 'Solicitud_DirGral_15432198-K.pdf', 'uploads/solicitudes/Solicitud_DirGral_15432198-K.pdf', 'Validado', 'Aprobado conforme formato O.G. N° 2551', '2026-01-10'),
    (@SolID_RM, 'Certificado de Nacimiento del Menor',    'Certificado_Nacimiento_MateoSoto.pdf', 'uploads/solicitudes/Certificado_Nacimiento_MateoSoto.pdf', 'Validado', 'Acreditado menor causante nacido 15/03/2024', '2026-01-10'),
    (@SolID_RM, 'Certificado Médico Imposibilidad Asistencia Sala Cuna', 'Certificado_Medico_MateoSoto.pdf', 'uploads/solicitudes/Certificado_Medico_MateoSoto.pdf', 'Validado', 'Acredita patología permanente hasta los 2 años', '2026-01-11'),
    (@SolID_RM, 'Resolución Exenta Jefatura de la Funcionaria', 'Resolucion_Exenta_Jefatura_JENAFAM.pdf', 'uploads/solicitudes/Resolucion_Exenta_Jefatura_JENAFAM.pdf', 'Validado', 'Resolución exenta aprobada por Jefatura', '2026-01-12');

-- Resolución de Aprobación e Ingreso a Lista de Pago
INSERT INTO dbo.Resoluciones (SolicitudID, NumeroResolucion, FechaResolucion, MontoMensualAprobado, CodigoRegion, CoordinadorEmisor, ObservacionesResolucion, ActivoEnListaPago, FechaIngresoListaPago)
VALUES (@SolID_RM, 'RES-BIENESTAR-2026-0001', '2026-01-15', 385000.00, 'RM', 'Marcela Paz Rojas Fuentes', 'Beneficio aprobado por cumplir 4/4 documentos legales y requisitos O.G. N° 2551.', 1, '2026-01-15');

-- Insertar Solicitud de Postulación en Proceso para Daniela Herrera (Región V - Valparaíso)
DECLARE @FuncID_V INT = (SELECT FuncionarioID FROM dbo.Funcionarios WHERE Rut = '16555444-3');
DECLARE @CoordID_V INT = (SELECT UsuarioID FROM dbo.UsuariosSistema WHERE Rut = '14222333-5');

INSERT INTO dbo.Solicitudes (FuncionarioID, CoordinadorID, CodigoRegion, MontoMensualBase, CantidadDocumentosRequeridos, Estado, EnListaPagoActiva, FechaSolicitud)
VALUES (@FuncID_V, @CoordID_V, 'V', 385000.00, 4, 'En Revision Coordinador', 0, '2026-02-01');

DECLARE @SolID_V INT = SCOPE_IDENTITY();

INSERT INTO dbo.DocumentosIniciales (SolicitudID, TipoDocumento, NombreArchivo, RutaAlmacenamiento, EstadoDocumento, ObservacionDocumento, FechaSubida) VALUES
    (@SolID_V, 'Solicitud Dirigida al Director General', 'Solicitud_DirGral_16555444-3.pdf', 'uploads/solicitudes/Solicitud_DirGral_16555444-3.pdf', 'Cargado', NULL, '2026-02-01'),
    (@SolID_V, 'Certificado de Nacimiento del Menor',    'Certificado_Nacimiento_JoaquinHerrera.pdf', 'uploads/solicitudes/Certificado_Nacimiento_JoaquinHerrera.pdf', 'Cargado', NULL, '2026-02-01'),
    (@SolID_V, 'Certificado Médico Imposibilidad Asistencia Sala Cuna', 'Certificado_Medico_JoaquinHerrera.pdf', 'uploads/solicitudes/Certificado_Medico_JoaquinHerrera.pdf', 'Cargado', NULL, '2026-02-01'),
    (@SolID_V, 'Resolución Exenta Jefatura de la Funcionaria', 'Resolucion_Exenta_Jefatura_BRICRIM.pdf', 'uploads/solicitudes/Resolucion_Exenta_Jefatura_BRICRIM.pdf', 'Cargado', NULL, '2026-02-01');
GO
