import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DocumentoInicialDto } from '../models/sala-cuna.models';

@Injectable({
  providedIn: 'root'
})
export class DocumentoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/documentos-iniciales`;

  listarPorSolicitud(solicitudId: number): Observable<DocumentoInicialDto[]> {
    return this.http.get<DocumentoInicialDto[]>(`${this.apiUrl}/solicitud/${solicitudId}`);
  }

  subirDocumentoInicial(
    solicitudId: number,
    tipoDocumento: string,
    archivo: File,
    usuarioResponsable?: string
  ): Observable<DocumentoInicialDto> {
    const formData = new FormData();
    formData.append('SolicitudID', solicitudId.toString());
    formData.append('TipoDocumento', tipoDocumento);
    formData.append('Archivo', archivo, archivo.name);
    if (usuarioResponsable) {
      formData.append('UsuarioResponsable', usuarioResponsable);
    }

    return this.http.post<DocumentoInicialDto>(`${this.apiUrl}/subir`, formData);
  }

  eliminarDocumento(documentoId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${documentoId}`);
  }

  obtenerUrlVisualizacion(documentoId: number): string {
    return `${this.apiUrl}/${documentoId}/ver`;
  }

  obtenerUrlDescarga(documentoId: number): string {
    return `${this.apiUrl}/${documentoId}/descargar`;
  }
}
