import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuditoriaSistemaDto,
  AvanzarEtapaCircuitoRequest,
  ControlMensualDto,
  HistorialAlertaDto,
  InicializarPresupuestoAnualRequest,
  ResumenPresupuestoAnualDto,
  RevisarAlertaRequest
} from '../models/sala-cuna.models';

@Injectable({
  providedIn: 'root'
})
export class ControlMensualService {
  private readonly http = inject(HttpClient);
  private readonly controlUrl = `${environment.apiBaseUrl}/control-mensual`;
  private readonly presupuestoUrl = `${environment.apiBaseUrl}/presupuesto-regional`;
  private readonly alertasUrl = `${environment.apiBaseUrl}/alertas`;
  private readonly auditoriaUrl = `${environment.apiBaseUrl}/auditoria`;

  listarControles(filtros?: {
    anio?: number | null;
    mes?: number | null;
    estadoFlujo?: string | null;
    funcionarioId?: number | null;
    codigoRegion?: string | null;
  }): Observable<ControlMensualDto[]> {
    let params = new HttpParams();
    if (filtros?.anio) params = params.set('anio', filtros.anio.toString());
    if (filtros?.mes) params = params.set('mes', filtros.mes.toString());
    if (filtros?.estadoFlujo) params = params.set('estadoFlujo', filtros.estadoFlujo);
    if (filtros?.funcionarioId) params = params.set('funcionarioId', filtros.funcionarioId.toString());
    if (filtros?.codigoRegion) params = params.set('codigoRegion', filtros.codigoRegion);

    return this.http.get<ControlMensualDto[]>(this.controlUrl, { params });
  }

  obtenerPorId(controlId: number): Observable<ControlMensualDto> {
    return this.http.get<ControlMensualDto>(`${this.controlUrl}/${controlId}`);
  }

  listarPorFuncionario(funcionarioId: number): Observable<ControlMensualDto[]> {
    return this.http.get<ControlMensualDto[]>(`${this.controlUrl}/funcionario/${funcionarioId}`);
  }

  /**
   * MÓDULO 2: Declaración Obligatoria del Día 30 de Asistencia y Licencias.
   */
  registrarDeclaracionDia30(datos: {
    solicitudID: number;
    anio: number;
    mes: number;
    tuvoCausalDescuento: boolean;
    diasFeriadoLegal: number;
    diasAdministrativos: number;
    diasLicenciaMedica: number;
    archivoRespaldo?: File | null;
    usuarioResponsable?: string;
  }): Observable<ControlMensualDto> {
    const formData = new FormData();
    formData.append('SolicitudID', datos.solicitudID.toString());
    formData.append('Anio', datos.anio.toString());
    formData.append('Mes', datos.mes.toString());
    formData.append('TuvoCausalDescuento', String(datos.tuvoCausalDescuento));
    formData.append('DiasFeriadoLegal', datos.diasFeriadoLegal.toString());
    formData.append('DiasAdministrativos', datos.diasAdministrativos.toString());
    formData.append('DiasLicenciaMedica', datos.diasLicenciaMedica.toString());

    if (datos.archivoRespaldo) {
      formData.append('ArchivoRespaldo', datos.archivoRespaldo, datos.archivoRespaldo.name);
    }
    if (datos.usuarioResponsable) {
      formData.append('UsuarioResponsable', datos.usuarioResponsable);
    }

    return this.http.post<ControlMensualDto>(`${this.controlUrl}/declaracion-dia30`, formData);
  }

  /**
   * MÓDULO 3: Avanza o devuelve una etapa del Circuito Administrativo Secuencial
   * (Coordinador -> Visador -> Logística -> Finanzas y Tesorería / DECOFI).
   */
  avanzarEtapaCircuito(
    controlId: number,
    request: AvanzarEtapaCircuitoRequest
  ): Observable<ControlMensualDto> {
    return this.http.put<ControlMensualDto>(
      `${this.controlUrl}/${controlId}/avanzar-etapa`,
      request
    );
  }

  obtenerUrlVisualizacion(controlId: number): string {
    return `${this.controlUrl}/${controlId}/ver`;
  }

  obtenerUrlArchivoRespaldo(controlId: number): string {
    return `${this.controlUrl}/${controlId}/descargar`;
  }

  // --- MÓDULO 4: Presupuesto Anual Regional (60% RM / 40% Regiones) ---
  obtenerPresupuestoAnualRegional(anio: number): Observable<ResumenPresupuestoAnualDto> {
    return this.http.get<ResumenPresupuestoAnualDto>(`${this.presupuestoUrl}/${anio}`);
  }

  inicializarPresupuestoAnualRegional(
    request: InicializarPresupuestoAnualRequest
  ): Observable<ResumenPresupuestoAnualDto> {
    return this.http.post<ResumenPresupuestoAnualDto>(
      `${this.presupuestoUrl}/inicializar`,
      request
    );
  }

  // --- Alertas ---
  listarAlertas(estadoAlerta?: string): Observable<HistorialAlertaDto[]> {
    let params = new HttpParams();
    if (estadoAlerta) params = params.set('estadoAlerta', estadoAlerta);
    return this.http.get<HistorialAlertaDto[]>(this.alertasUrl, { params });
  }

  generarAlertasPendientes(): Observable<HistorialAlertaDto[]> {
    return this.http.post<HistorialAlertaDto[]>(`${this.alertasUrl}/generar-pendientes`, {});
  }

  marcarAlertaRevisada(alertaId: number, request: RevisarAlertaRequest): Observable<HistorialAlertaDto> {
    return this.http.put<HistorialAlertaDto>(`${this.alertasUrl}/${alertaId}/revisar`, request);
  }

  // --- Auditoría ---
  listarAuditoria(tablaAfectada?: string, limite = 150): Observable<AuditoriaSistemaDto[]> {
    let params = new HttpParams().set('limite', limite.toString());
    if (tablaAfectada) params = params.set('tablaAfectada', tablaAfectada);
    return this.http.get<AuditoriaSistemaDto[]>(this.auditoriaUrl, { params });
  }
}
