import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SimuladorFechaService {
  private readonly STORAGE_KEY = 'sala_cuna_fecha_emulada';
  private readonly fechaSubject: BehaviorSubject<Date>;
  readonly fecha$: Observable<Date>;

  constructor() {
    const fechaGuardada = localStorage.getItem(this.STORAGE_KEY);
    let fechaInicial = new Date();

    if (fechaGuardada) {
      const parsed = new Date(fechaGuardada);
      if (!isNaN(parsed.getTime())) {
        fechaInicial = parsed;
      }
    } else {
      // Por defecto, inicializamos en el día 30 del mes en curso para facilitar la simulación inmediata
      const hoy = new Date();
      fechaInicial = new Date(hoy.getFullYear(), hoy.getMonth(), 30, 12, 0, 0);
      localStorage.setItem(this.STORAGE_KEY, fechaInicial.toISOString());
    }

    this.fechaSubject = new BehaviorSubject<Date>(fechaInicial);
    this.fecha$ = this.fechaSubject.asObservable();
  }

  get fechaActual(): Date {
    return this.fechaSubject.value;
  }

  get fechaFormatoIsoDate(): string {
    const f = this.fechaActual;
    const anio = f.getFullYear();
    const mes = String(f.getMonth() + 1).padStart(2, '0');
    const dia = String(f.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  get anio(): number {
    return this.fechaActual.getFullYear();
  }

  get mes(): number {
    return this.fechaActual.getMonth() + 1;
  }

  get dia(): number {
    return this.fechaActual.getDate();
  }

  get esDia30(): boolean {
    return this.dia === 30;
  }

  establecerFechaPorString(valorYyyyMmDd: string): void {
    if (!valorYyyyMmDd) return;
    const partes = valorYyyyMmDd.split('-');
    if (partes.length === 3) {
      const anio = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10) - 1;
      const dia = parseInt(partes[2], 10);
      const nueva = new Date(anio, mes, dia, 12, 0, 0);
      this.actualizarFecha(nueva);
    }
  }

  irAHoyReal(): void {
    this.actualizarFecha(new Date());
  }

  irADia30MesActual(): void {
    const hoy = new Date();
    const dia30 = new Date(hoy.getFullYear(), hoy.getMonth(), 30, 12, 0, 0);
    this.actualizarFecha(dia30);
  }

  irADia30Mes(anio: number, mes: number): void {
    // mes 1-12
    const fecha = new Date(anio, mes - 1, 30, 12, 0, 0);
    this.actualizarFecha(fecha);
  }

  irADia30MesSiguiente(): void {
    const actual = this.fechaActual;
    const siguiente = new Date(actual.getFullYear(), actual.getMonth() + 1, 30, 12, 0, 0);
    this.actualizarFecha(siguiente);
  }

  irADia30MesAnterior(): void {
    const actual = this.fechaActual;
    const anterior = new Date(actual.getFullYear(), actual.getMonth() - 1, 30, 12, 0, 0);
    this.actualizarFecha(anterior);
  }

  irACierreAnual(anio?: number): void {
    const y = anio || this.anio;
    const cierre = new Date(y, 11, 31, 12, 0, 0); // 31 de Diciembre
    this.actualizarFecha(cierre);
  }

  private actualizarFecha(nueva: Date): void {
    localStorage.setItem(this.STORAGE_KEY, nueva.toISOString());
    this.fechaSubject.next(nueva);
  }
}
