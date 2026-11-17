import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FuncionarioDto, SincronizarFuncionarioRequest } from '../models/sala-cuna.models';

@Injectable({
  providedIn: 'root'
})
export class FuncionarioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/funcionarios`;

  listarTodos(): Observable<FuncionarioDto[]> {
    return this.http.get<FuncionarioDto[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<FuncionarioDto> {
    return this.http.get<FuncionarioDto>(`${this.apiUrl}/${id}`);
  }

  obtenerPorRut(rut: string): Observable<FuncionarioDto> {
    return this.http.get<FuncionarioDto>(`${this.apiUrl}/rut/${encodeURIComponent(rut.trim())}`);
  }

  sincronizarPorRut(request: SincronizarFuncionarioRequest): Observable<FuncionarioDto> {
    return this.http.post<FuncionarioDto>(`${this.apiUrl}/sincronizar`, request);
  }
}
