import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest, RolSistema, UsuarioSistemaDto } from '../models/sala-cuna.models';
import { UsuarioSistemaService } from './usuario-sistema.service';
import { NotificacionService } from './notificacion.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly usuarioService = inject(UsuarioSistemaService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly router = inject(Router);

  private readonly storageKey = 'sala_cuna_pdi_sesion_activa';
  private readonly sesionSubject = new BehaviorSubject<UsuarioSistemaDto | null>(
    this.recuperarSesionGuardada()
  );

  readonly sesion$: Observable<UsuarioSistemaDto | null> = this.sesionSubject.asObservable();

  constructor() {
    const actual = this.sesionSubject.value;
    if (actual) {
      this.notificacionService.establecerUsuarioResponsable(
        `${actual.nombreCompleto} (${actual.rol})`
      );
    }
  }

  get usuarioActual(): UsuarioSistemaDto | null {
    return this.sesionSubject.value;
  }

  get estaAutenticado(): boolean {
    return !!this.sesionSubject.value;
  }

  get esAdministrador(): boolean {
    return this.sesionSubject.value?.rol === 'Administrador';
  }

  get codigoRegionActual(): string {
    return this.sesionSubject.value?.codigoRegion || 'RM';
  }

  get esRegionMetropolitana(): boolean {
    return this.codigoRegionActual === 'RM';
  }

  get nombreRegionActual(): string {
    return this.sesionSubject.value?.nombreRegion || (this.esRegionMetropolitana ? 'Región Metropolitana de Santiago' : `Región ${this.codigoRegionActual}`);
  }

  iniciarSesion(credenciales: LoginRequest): Observable<UsuarioSistemaDto> {
    return this.usuarioService.login(credenciales).pipe(
      tap((usuario) => {
        localStorage.setItem(this.storageKey, JSON.stringify(usuario));
        this.sesionSubject.next(usuario);
        this.notificacionService.establecerUsuarioResponsable(
          `${usuario.nombreCompleto} (${usuario.rol})`
        );
      })
    );
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.storageKey);
    this.sesionSubject.next(null);
    this.router.navigate(['/login']);
  }

  obtenerRutaPorRol(rol: RolSistema | string): string {
    switch (rol) {
      case 'Postulante':
        return '/postulante';
      case 'Coordinador':
        return '/coordinador';
      case 'Visador':
        return '/visador';
      case 'Logistica':
        return '/logistica';
      case 'Finanzas':
        return '/finanzas';
      case 'Tesoreria':
        return '/tesoreria';
      case 'Administrador':
        return '/administrador';
      default:
        return '/login';
    }
  }

  private recuperarSesionGuardada(): UsuarioSistemaDto | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      return JSON.parse(raw) as UsuarioSistemaDto;
    } catch {
      return null;
    }
  }
}
