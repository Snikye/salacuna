/**
 * Modelos e interfaces TypeScript sincronizados con los 4 Módulos del Sistema
 * "Bono Compensatorio de Sala Cuna" de la Jefatura de Bienestar de la PDI:
 * - Módulo 1: Postulación, Revisión Documental del Coordinador y Número de Resolución (Ingreso a Lista de Pago Activa).
 * - Módulo 2: Control Mensual de Asistencia y Licencias (Día 30) con Cálculo Proporcional sobre base de 30 días.
 * - Módulo 3: Circuito Secuencial (Coordinador -> Visador -> Logística -> Finanzas y Tesorería / Evaluación DECOFI y Arrastre).
 * - Módulo 4: Distribución Presupuestaria Anual Regional (60% RM / 40% 15 Regiones Restantes).
 */

export type RolSistema =
  | 'Postulante'
  | 'Coordinador'
  | 'Visador'
  | 'Logistica'
  | 'Finanzas'
  | 'Tesoreria'
  | 'Administrador';

export interface UsuarioSistemaDto {
  usuarioID: number;
  rut: string;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  rol: RolSistema;
  codigoRegion: string;
  nombreRegion: string;
  esRegionMetropolitana?: boolean;
  correoElectronico: string;
  activo?: boolean;
  funcionarioID?: number | null;
  fechaCreacion?: string | null;
}

export interface LoginRequest {
  rut: string;
  password: string;
}

export interface CrearActualizarUsuarioSistemaRequest {
  rut: string;
  nombres: string;
  apellidos: string;
  rol: RolSistema;
  codigoRegion?: string | null;
  nombreRegion?: string | null;
  correoElectronico: string;
  password?: string | null;
}

export interface FuncionarioDto {
  funcionarioID: number;
  rut: string;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  escalafon?: string | null;
  unidad?: string | null;
  codigoRegion: string;
  nombreRegion: string;
  telefono?: string | null;
  numeroSide?: string | null;
  correoElectronico: string;
  nombreMenor?: string | null;
  rutMenor?: string | null;
  fechaNacimientoMenor?: string | null;
  fechaRegistro?: string | null;
}

export interface SincronizarFuncionarioRequest {
  rut: string;
  nombres: string;
  apellidos: string;
  escalafon?: string | null;
  unidad?: string | null;
  codigoRegion?: string | null;
  nombreRegion?: string | null;
  telefono?: string | null;
  numeroSide?: string | null;
  correoElectronico: string;
  nombreMenor?: string | null;
  rutMenor?: string | null;
  fechaNacimientoMenor?: string | null;
}

export interface DocumentoInicialDto {
  documentoID: number;
  solicitudID: number;
  tipoDocumento: string;
  nombreArchivo: string;
  rutaAlmacenamiento: string;
  estadoDocumento: string;
  observacionDocumento?: string | null;
  fechaSubida?: string | null;
  urlDescarga: string;
}

export interface ResolucionDto {
  resolucionID: number;
  solicitudID: number;
  numeroResolucion: string;
  fechaResolucion: string;
  montoMensualAprobado: number;
  fechaInicioBeneficio: string;
  fechaTerminoBeneficio?: string | null;
  estadoResolucion: string;
  coordinadorEmisor?: string | null;
  observaciones?: string | null;
  fechaRegistro?: string | null;
}

export type EstadoSolicitudEtapa1 =
  | 'En Postulacion'
  | 'En Revision Coordinador'
  | 'Rechazada por Coordinador'
  | 'En Espera Resolucion'
  | 'En Lista de Pago Activa'
  | 'Beneficio Cancelado';

export interface SolicitudDto {
  solicitudID: number;
  funcionarioID: number;
  funcionarioRut?: string | null;
  funcionarioNombreCompleto?: string | null;
  funcionarioUnidad?: string | null;
  funcionarioEscalafon?: string | null;
  funcionarioTelefono?: string | null;
  funcionarioNumeroSide?: string | null;
  funcionarioCorreo?: string | null;
  nombreMenor?: string | null;
  rutMenor?: string | null;
  fechaNacimientoMenor?: string | null;
  coordinadorID?: number | null;
  coordinadorNombre?: string | null;
  codigoRegion: string;
  nombreRegion?: string | null;
  montoMensualBase: number;
  cantidadDocumentosRequeridos: number;
  cantidadDocumentosSubidos: number;
  carpetaCompleta: boolean;
  fechaSolicitud?: string | null;
  estado: EstadoSolicitudEtapa1 | string;
  motivoRechazoCorrecciones?: string | null;
  observacionesCoordinador?: string | null;
  fechaRevisionCoordinador?: string | null;
  fechaIngresoListaPago?: string | null;
  enListaPagoActiva: boolean;
  resolucion?: ResolucionDto | null;
  documentosIniciales: DocumentoInicialDto[];
}

export interface CrearSolicitudRequest {
  funcionarioID: number;
  coordinadorID?: number | null;
  codigoRegion?: string | null;
  montoMensualBase: number;
  cantidadDocumentosRequeridos: number;
  observacionesIniciales?: string | null;
}

export interface EvaluacionDocumentoItemDto {
  documentoID: number;
  aprobado: boolean;
  observacion?: string | null;
}

export interface RevisarDocumentacionCoordinadorRequest {
  aprobarDocumentacion: boolean;
  motivoRechazoCorrecciones?: string | null;
  observacionesCoordinador?: string | null;
  coordinadorID?: number | null;
  usuarioResponsable?: string | null;
  evaluacionesDocumentos?: EvaluacionDocumentoItemDto[];
}

export interface EmitirResolucionRequest {
  numeroResolucion: string;
  fechaResolucion?: string | null;
  montoMensualAprobado: number;
  fechaInicioBeneficio?: string | null;
  coordinadorEmisor?: string | null;
  observaciones?: string | null;
}

export interface EtapaFlujoDto {
  etapaID: number;
  controlID: number;
  rolResponsable: string;
  nombreResponsable: string;
  accionRealizada: string;
  estadoResultante: string;
  montoInvolucrado?: number | null;
  anioImputacion?: number | null;
  esArrastrePresupuestario: boolean;
  evaluacionDecofi?: string | null;
  observaciones?: string | null;
  fechaRegistro: string;
}

export type EstadoFlujoMensual =
  | 'Notificado Dia 30'
  | 'Devuelto a Coordinador'
  | 'Visto Bueno Coordinador'
  | 'Beneficio Cancelado'
  | 'Visado Conforme'
  | 'Compromiso Logistica'
  | 'Pagado Finanzas'
  | 'Arrastre Presupuestario';

export interface ControlMensualDto {
  controlID: number;
  solicitudID: number;
  funcionarioID: number;
  funcionarioRut?: string | null;
  funcionarioNombreCompleto?: string | null;
  funcionarioUnidad?: string | null;
  funcionarioEscalafon?: string | null;
  funcionarioTelefono?: string | null;
  funcionarioNumeroSide?: string | null;
  funcionarioCorreo?: string | null;
  nombreMenor?: string | null;

  resolucionID?: number | null;
  numeroResolucion?: string | null;

  anio: number;
  mes: number;
  codigoRegion: string;
  fechaNotificacionDia30: string;

  // Módulo 2: Declaración Día 30 y Cálculo Proporcional sobre 30 días
  tuvoCausalDescuento: boolean;
  diasBaseMes: number;
  diasFeriadoLegal: number;
  diasAdministrativos: number;
  diasLicenciaMedica: number;
  diasDescontadosTotales: number;
  diasEfectivos: number;
  montoMensualBase: number;
  montoProporcionalCalculado: number;

  rutaArchivoRespaldo?: string | null;
  urlDescargaArchivo?: string | null;

  estadoFlujo: EstadoFlujoMensual | string;

  // Módulo 3: Trazabilidad por Rol
  coordinadorResponsable?: string | null;
  observacionCoordinador?: string | null;
  fechaVistoBuenoCoordinador?: string | null;

  visadorResponsable?: string | null;
  observacionVisador?: string | null;
  fechaVisacion?: string | null;

  logisticaResponsable?: string | null;
  numeroCompromisoPago?: string | null;
  fechaCompromisoLogistica?: string | null;

  finanzasResponsable?: string | null;
  tipoEjecucionFinanzas?: string | null;
  anioImputacionPresupuestaria?: number | null;
  evaluacionDecofi?: string | null;
  comprobanteTesoreria?: string | null;
  fechaEjecucionFinanzas?: string | null;

  etapasFlujo: EtapaFlujoDto[];
}

export interface AvanzarEtapaCircuitoRequest {
  rolAccion: 'COORDINADOR' | 'VISADOR' | 'LOGISTICA' | 'FINANZAS' | 'TESORERIA';
  accion:
    | 'VISTO_BUENO'
    | 'CANCELAR_BENEFICIO'
    | 'APROBAR'
    | 'DEVOLVER'
    | 'COMPROMETER'
    | 'DEVENGAR_PAGAR'
    | 'ARRASTRE'
    | 'PAGAR_TESORERIA';
  nombreResponsable: string;
  observaciones?: string | null;
  numeroDocumentoCompromiso?: string | null;
  anioArrastreDestino?: number | null;
  evaluacionDecofi?: string | null;
}

export interface PresupuestoRegionalDto {
  presupuestoID: number;
  anio: number;
  codigoRegion: string;
  nombreRegion: string;
  esRegionMetropolitana: boolean;
  porcentajeAsignado: number;
  montoAsignadoInicial: number;
  montoArrastreAnterior: number;
  montoPresupuestoVigente: number;
  montoComprometido: number;
  montoDevengadoPagado: number;
  montoDisponible: number;
  porcentajeEjecucion: number;
  numeroResolucion?: string | null;
  fechaActualizacion?: string | null;
}

export interface ResumenPresupuestoAnualDto {
  anio: number;
  numeroResolucion?: string | null;
  bolsaAnualInicialTotal: number;
  montoArrastreTotal: number;
  presupuestoVigenteTotal: number;
  montoAsignadoRM: number;
  montoAsignadoRegiones: number;
  totalComprometido: number;
  totalDevengadoPagado: number;
  totalDisponible: number;
  regiones: PresupuestoRegionalDto[];
}

export interface InicializarPresupuestoAnualRequest {
  anio: number;
  numeroResolucion?: string | null;
  montoTotalAnual: number;
  montoDesignadoRegiones?: number | null;
  usuarioResponsable?: string | null;
}

export type EstadoAlerta = 'Enviada' | 'Revisada';

export interface HistorialAlertaDto {
  alertaID: number;
  controlID?: number | null;
  solicitudID?: number | null;
  funcionarioID?: number | null;
  funcionarioRut?: string | null;
  funcionarioNombreCompleto?: string | null;
  funcionarioUnidad?: string | null;
  anio?: number | null;
  mes?: number | null;
  estadoFlujoControl?: string | null;
  destinatarioRol: string;
  fechaAlerta?: string | null;
  mensaje: string;
  estadoAlerta: EstadoAlerta;
}

export interface RevisarAlertaRequest {
  usuarioResponsable?: string | null;
  detalleRevision?: string | null;
}

export interface AuditoriaSistemaDto {
  auditoriaID: number;
  usuarioResponsable: string;
  accion: string;
  tablaAfectada: string;
  registroID: number;
  detalleCambio?: string | null;
  direccionIP?: string | null;
  fechaHora?: string | null;
}

export interface CatalogoDocumentoInicial {
  codigo: string;
  nombre: string;
  descripcion: string;
}

export const TIPOS_DOCUMENTOS_INICIALES: CatalogoDocumentoInicial[] = [
  {
    codigo: 'Solicitud Director General',
    nombre: '1. Solicitud dirigida al Director General',
    descripcion: 'Solicitud formal institucional según Orden General N° 2551 (modifica O.G. N° 874) con dotación y domicilio de cuidado.'
  },
  {
    codigo: 'Certificado Nacimiento',
    nombre: '2. Certificado de nacimiento del menor',
    descripcion: 'Certificado oficial emitido por el Registro Civil que acredita filiación y edad menor a dos años.'
  },
  {
    codigo: 'Certificado Medico Incompatibilidad',
    nombre: '3. Certificado médico que acredite la patología del menor',
    descripcion: 'Certificado médico que acredite la patología del menor y que señale que NO puede asistir a sala cuna de manera permanente hasta los dos años.'
  },
  {
    codigo: 'Resolucion Exenta Jefatura',
    nombre: '4. Resolución Exenta emanada por la jefatura',
    descripcion: 'Resolución Exenta formal emanada por la jefatura de la funcionaria solicitante autorizando la tramitación.'
  }
];

export const REGIONES_CHILE: { codigo: string; nombre: string; esRM: boolean }[] = [
  { codigo: 'RM', nombre: 'Región Metropolitana de Santiago (60%)', esRM: true },
  { codigo: 'XV', nombre: 'XV - Región de Arica y Parinacota', esRM: false },
  { codigo: 'I', nombre: 'I - Región de Tarapacá', esRM: false },
  { codigo: 'II', nombre: 'II - Región de Antofagasta', esRM: false },
  { codigo: 'III', nombre: 'III - Región de Atacama', esRM: false },
  { codigo: 'IV', nombre: 'IV - Región de Coquimbo', esRM: false },
  { codigo: 'V', nombre: 'V - Región de Valparaíso', esRM: false },
  { codigo: 'VI', nombre: 'VI - Región de O\'Higgins', esRM: false },
  { codigo: 'VII', nombre: 'VII - Región del Maule', esRM: false },
  { codigo: 'XVI', nombre: 'XVI - Región de Ñuble', esRM: false },
  { codigo: 'VIII', nombre: 'VIII - Región del Biobío', esRM: false },
  { codigo: 'IX', nombre: 'IX - Región de La Araucanía', esRM: false },
  { codigo: 'XIV', nombre: 'XIV - Región de Los Ríos', esRM: false },
  { codigo: 'X', nombre: 'X - Región de Los Lagos', esRM: false },
  { codigo: 'XI', nombre: 'XI - Región de Aysén', esRM: false },
  { codigo: 'XII', nombre: 'XII - Región de Magallanes', esRM: false }
];

export const MESES_CATALOGO: { numero: number; nombre: string }[] = [
  { numero: 1, nombre: 'Enero' },
  { numero: 2, nombre: 'Febrero' },
  { numero: 3, nombre: 'Marzo' },
  { numero: 4, nombre: 'Abril' },
  { numero: 5, nombre: 'Mayo' },
  { numero: 6, nombre: 'Junio' },
  { numero: 7, nombre: 'Julio' },
  { numero: 8, nombre: 'Agosto' },
  { numero: 9, nombre: 'Septiembre' },
  { numero: 10, nombre: 'Octubre' },
  { numero: 11, nombre: 'Noviembre' },
  { numero: 12, nombre: 'Diciembre' }
];
