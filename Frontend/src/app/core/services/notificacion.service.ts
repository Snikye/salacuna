import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface MensajeNotificacion {
  id: number;
  tipo: 'exito' | 'error' | 'info' | 'alerta';
  texto: string;
  fecha: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private readonly notificacionesSubject = new BehaviorSubject<MensajeNotificacion[]>([]);
  private readonly usuarioResponsableSubject = new BehaviorSubject<string>('12.345.678-9');
  private readonly cargandoSubject = new BehaviorSubject<boolean>(false);
  private peticionesActivas = 0;
  private contadorId = 1;

  get notificaciones$(): Observable<MensajeNotificacion[]> {
    return this.notificacionesSubject.asObservable();
  }

  get usuarioResponsable$(): Observable<string> {
    return this.usuarioResponsableSubject.asObservable();
  }

  get cargando$(): Observable<boolean> {
    return this.cargandoSubject.asObservable();
  }

  get usuarioActual(): string {
    return this.usuarioResponsableSubject.value;
  }

  establecerUsuarioResponsable(usuario: string): void {
    const limpio = usuario?.trim() || 'Sistema';
    this.usuarioResponsableSubject.next(limpio);
  }

  iniciarCarga(): void {
    this.peticionesActivas++;
    if (this.peticionesActivas === 1) {
      this.cargandoSubject.next(true);
    }
  }

  finalizarCarga(): void {
    this.peticionesActivas = Math.max(0, this.peticionesActivas - 1);
    if (this.peticionesActivas === 0) {
      this.cargandoSubject.next(false);
    }
  }

  mostrar(tipo: 'exito' | 'error' | 'info' | 'alerta', texto: string): void {
    const id = this.contadorId++;
    const nueva: MensajeNotificacion = {
      id,
      tipo,
      texto,
      fecha: new Date()
    };
    const actual = this.notificacionesSubject.value;
    this.notificacionesSubject.next([nueva, ...actual].slice(0, 4));

    setTimeout(() => {
      this.cerrar(id);
    }, 6000);
  }

  exito(texto: string): void {
    this.mostrar('exito', texto);
  }

  error(texto: string): void {
    this.mostrar('error', texto);
  }

  info(texto: string): void {
    this.mostrar('info', texto);
  }

  alerta(texto: string): void {
    this.mostrar('alerta', texto);
  }

  cerrar(id: number): void {
    const filtradas = this.notificacionesSubject.value.filter(n => n.id !== id);
    this.notificacionesSubject.next(filtradas);
  }
}
