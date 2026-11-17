import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CrearSolicitudRequest,
  EmitirResolucionRequest,
  RevisarDocumentacionCoordinadorRequest,
  SolicitudDto
} from '../models/sala-cuna.models';

@Injectable({
  providedIn: 'root'
})
export class SolicitudService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/solicitudes`;

  listarSolicitudes(estado?: string, enListaPagoActiva?: boolean, codigoRegion?: string): Observable<SolicitudDto[]> {
    let params = new HttpParams();
    if (estado && estado.trim().length > 0) {
      params = params.set('estado', estado.trim());
    }
    if (enListaPagoActiva !== undefined && enListaPagoActiva !== null) {
      params = params.set('enListaPagoActiva', String(enListaPagoActiva));
    }
    if (codigoRegion && codigoRegion.trim().length > 0) {
      params = params.set('codigoRegion', codigoRegion.trim());
    }
    return this.http.get<SolicitudDto[]>(this.apiUrl, { params });
  }

  listarPendientes(codigoRegion?: string): Observable<SolicitudDto[]> {
    let params = new HttpParams();
    if (codigoRegion && codigoRegion.trim().length > 0) {
      params = params.set('codigoRegion', codigoRegion.trim());
    }
    return this.http.get<SolicitudDto[]>(`${this.apiUrl}/pendientes`, { params });
  }

  listarEnListaPagoActiva(codigoRegion?: string): Observable<SolicitudDto[]> {
    let params = new HttpParams();
    if (codigoRegion && codigoRegion.trim().length > 0) {
      params = params.set('codigoRegion', codigoRegion.trim());
    }
    return this.http.get<SolicitudDto[]>(`${this.apiUrl}/lista-pago-activa`, { params });
  }

  listarPorFuncionario(funcionarioId: number): Observable<SolicitudDto[]> {
    return this.http.get<SolicitudDto[]>(`${this.apiUrl}/funcionario/${funcionarioId}`);
  }

  obtenerPorId(solicitudId: number): Observable<SolicitudDto> {
    return this.http.get<SolicitudDto>(`${this.apiUrl}/${solicitudId}`);
  }

  crearSolicitud(request: CrearSolicitudRequest): Observable<SolicitudDto> {
    return this.http.post<SolicitudDto>(this.apiUrl, request);
  }

  revisarDocumentacion(
    solicitudId: number,
    request: RevisarDocumentacionCoordinadorRequest
  ): Observable<SolicitudDto> {
    return this.http.put<SolicitudDto>(
      `${this.apiUrl}/${solicitudId}/revisar-documentacion`,
      request
    );
  }

  emitirResolucion(
    solicitudId: number,
    request: EmitirResolucionRequest
  ): Observable<SolicitudDto> {
    return this.http.post<SolicitudDto>(
      `${this.apiUrl}/${solicitudId}/emitir-resolucion`,
      request
    );
  }
}
