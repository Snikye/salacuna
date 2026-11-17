import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CrearActualizarUsuarioSistemaRequest,
  LoginRequest,
  UsuarioSistemaDto
} from '../models/sala-cuna.models';

@Injectable({
  providedIn: 'root'
})
export class UsuarioSistemaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/usuarios-sistema`;

  login(request: LoginRequest): Observable<UsuarioSistemaDto> {
    return this.http.post<UsuarioSistemaDto>(`${this.apiUrl}/login`, request);
  }

  listar(rol?: string): Observable<UsuarioSistemaDto[]> {
    let params = new HttpParams();
    if (rol && rol.trim().length > 0) {
      params = params.set('rol', rol.trim());
    }
    return this.http.get<UsuarioSistemaDto[]>(this.apiUrl, { params });
  }

  guardar(request: CrearActualizarUsuarioSistemaRequest): Observable<UsuarioSistemaDto> {
    return this.http.post<UsuarioSistemaDto>(this.apiUrl, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
