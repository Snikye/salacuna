import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NotificacionService } from './core/services/notificacion.service';
import { AuthService } from './core/services/auth.service';
import { SimuladorFechaService } from './core/services/simulador-fecha.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <!-- Barra de Progreso de Petición HTTP -->
    <div class="http-loader" *ngIf="notificacionService.cargando$ | async"></div>

    <!-- Header Institucional PDI -->
    <header class="top-navbar">
      <div class="navbar-brand">
        <div class="pdi-emblem">PDI</div>
        <div class="brand-text">
          <span class="brand-title">JEFATURA DE BIENESTAR PDI — BONO COMPENSATORIO DE SALA CUNA</span>
          <span class="brand-subtitle">
            Postulante · Coordinador · Visador · Logística · Finanzas (DECOFI / 60-40) · Tesorería
          </span>
        </div>
      </div>

      <!-- Enrutamiento Condicional según el Rol Autenticado -->
      <nav class="navbar-links" *ngIf="authService.sesion$ | async as sesion">
        <a
          *ngIf="sesion.rol === 'Postulante' || sesion.rol === 'Administrador'"
          routerLink="/postulante"
          routerLinkActive="active-link"
          class="nav-item"
        >
          Portal Postulante
        </a>
        <a
          *ngIf="sesion.rol === 'Coordinador' || sesion.rol === 'Administrador'"
          routerLink="/coordinador"
          routerLinkActive="active-link"
          class="nav-item"
        >
          1. Coordinador
        </a>
        <a
          *ngIf="sesion.rol === 'Visador' || sesion.rol === 'Administrador'"
          routerLink="/visador"
          routerLinkActive="active-link"
          class="nav-item"
        >
          2. Visador
        </a>
        <a
          *ngIf="sesion.rol === 'Logistica' || sesion.rol === 'Administrador'"
          routerLink="/logistica"
          routerLinkActive="active-link"
          class="nav-item"
        >
          3. Logística
        </a>
        <a
          *ngIf="sesion.rol === 'Finanzas' || sesion.rol === 'Administrador'"
          routerLink="/finanzas"
          routerLinkActive="active-link"
          class="nav-item"
        >
          4. Finanzas / DECOFI
        </a>
        <a
          *ngIf="sesion.rol === 'Tesoreria' || sesion.rol === 'Administrador'"
          routerLink="/tesoreria"
          routerLinkActive="active-link"
          class="nav-item"
        >
          5. Tesorería
        </a>
        <a
          *ngIf="sesion.rol === 'Administrador'"
          routerLink="/administrador"
          routerLinkActive="active-link"
          class="nav-item"
        >
          Administración (RUTs)
        </a>
      </nav>

      <!-- Información de Sesión Activa y Botón Cerrar Sesión -->
      <div class="audit-user-box" *ngIf="authService.sesion$ | async as sesion">
        <span style="font-size: 0.8rem; color: #e2e8f0; margin-right: 0.5rem;">
          <strong>{{ sesion.rol | uppercase }}:</strong> {{ sesion.nombreCompleto }} ({{ sesion.rut }})
        </span>
        <button
          class="btn btn-sm btn-danger"
          style="padding: 0.25rem 0.65rem; font-size: 0.78rem;"
          (click)="authService.cerrarSesion()"
        >
          Cerrar Sesión
        </button>
      </div>
    </header>

    <!-- Barra del Calendario Emulador del Sistema (Simulador Día 30 y Procesos de Flujo) -->
    <section class="simulator-bar">
      <div class="simulator-info">
        <span class="simulator-badge" [class.dia30]="simuladorFecha.esDia30">
          {{ simuladorFecha.esDia30 ? '✔ CORTE DÍA 30 ACTIVO' : 'CALENDARIO EMULADOR' }}
        </span>
        <span class="simulator-date-label">
          Fecha Sistema: <strong>{{ simuladorFecha.fecha$ | async | date:'dd/MM/yyyy' }}</strong> (Año: {{ simuladorFecha.anio }} / Mes: {{ simuladorFecha.mes }})
        </span>
      </div>

      <div class="simulator-controls">
        <label style="color: #94a3b8; font-size: 0.78rem;">Seleccionar Fecha:</label>
        <input
          type="date"
          class="simulator-input-date"
          [ngModel]="simuladorFecha.fechaFormatoIsoDate"
          (ngModelChange)="simuladorFecha.establecerFechaPorString($event)"
        />
        <button
          type="button"
          class="btn-simulator dia30"
          (click)="simuladorFecha.irADia30MesActual()"
          title="Fijar en el Día 30 del Mes Actual para habilitar la Declaración y el Corte"
        >
          ⚡ Día 30 Mes Actual
        </button>
        <button
          type="button"
          class="btn-simulator dia30"
          (click)="simuladorFecha.irADia30MesSiguiente()"
          title="Avanzar al Día 30 del Mes Siguiente"
        >
          ⏩ Día 30 Mes Siguiente
        </button>
        <button
          type="button"
          class="btn-simulator"
          (click)="simuladorFecha.irACierreAnual()"
          title="Fijar al 31 de Diciembre para evaluar Arrastre Presupuestario"
        >
          🎯 31 Dic (Cierre Anual)
        </button>
        <button
          type="button"
          class="btn-simulator"
          (click)="simuladorFecha.irAHoyReal()"
          title="Restablecer a la fecha real del reloj"
        >
          ↺ Hoy Real
        </button>
      </div>
    </section>

    <!-- Bandeja Flotante de Notificaciones Reactivas (RxJS) -->
    <div class="toast-container">
      <div
        *ngFor="let n of notificacionService.notificaciones$ | async"
        class="toast-item"
        [ngClass]="'toast-' + n.tipo"
      >
        <div class="toast-content">
          <strong>
            {{ n.tipo === 'exito' ? 'Éxito' : n.tipo === 'error' ? 'Error' : n.tipo === 'alerta' ? 'Atención' : 'Información' }}:
          </strong>
          <span>{{ n.texto }}</span>
        </div>
        <button class="toast-close" (click)="notificacionService.cerrar(n.id)">✕</button>
      </div>
    </div>

    <!-- Contenedor Principal de Vistas -->
    <main class="main-viewport">
      <router-outlet></router-outlet>
    </main>

    <footer class="app-footer">
      <span>Policía de Investigaciones de Chile — Jefatura de Bienestar — Bono Compensatorio de Sala Cuna</span>
      <span>Flujo Auditado por Rol: Postulante → Coordinador → Visador → Logística → Finanzas (DECOFI) → Tesorería</span>
    </footer>
  `
})
export class AppComponent {
  readonly notificacionService = inject(NotificacionService);
  readonly authService = inject(AuthService);
  readonly simuladorFecha = inject(SimuladorFechaService);
}
