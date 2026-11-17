import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';

@Component({
  selector: 'app-vista-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container" style="max-width: 960px; margin: 2rem auto;">
      <div class="card" style="padding: 2rem; border-top: 5px solid var(--primary);">
        <div style="text-align: center; margin-bottom: 1.75rem;">
          <div
            class="pdi-emblem"
            style="margin: 0 auto 0.75rem auto; width: 58px; height: 58px; font-size: 1.25rem; display: flex; align-items: center; justify-content: center;"
          >
            PDI
          </div>
          <span class="badge-institucional">JEFATURA NACIONAL DE BIENESTAR Y CALIDAD DE VIDA PDI</span>
          <h1 style="margin-top: 0.5rem; font-size: 1.55rem;">
            Portal de Acceso por Rol — Bono Compensatorio de Sala Cuna
          </h1>
          <p class="subtitle">
            Ingrese con su <strong>RUT y Contraseña</strong> para acceder a su bandeja exclusiva según su perfil operativo.
          </p>
        </div>

        <div class="split-layout">
          <!-- Formulario de Login por RUT y Contraseña -->
          <div class="split-main">
            <div class="sync-panel" style="margin-top: 0;">
              <h3>Iniciar Sesión Institucional</h3>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label for="loginRut">RUT del Usuario *</label>
                <input
                  id="loginRut"
                  type="text"
                  class="input-control"
                  [(ngModel)]="rut"
                  placeholder="Ej: 18441463-5"
                  (keyup.enter)="ingresar()"
                />
              </div>

              <div class="form-group" style="margin-bottom: 1.25rem;">
                <label for="loginPass">Contraseña *</label>
                <input
                  id="loginPass"
                  type="password"
                  class="input-control"
                  [(ngModel)]="password"
                  placeholder="Ingrese su contraseña..."
                  (keyup.enter)="ingresar()"
                />
              </div>

              <button
                class="btn btn-primary"
                style="width: 100%; justify-content: center; padding: 0.75rem;"
                (click)="ingresar()"
              >
                Ingresar al Sistema →
              </button>
            </div>
          </div>

          <!-- Accesos Rápidos por Rol y Región (Configurados por el Administrador 18441463-5) -->
          <div class="split-side">
            <div class="folder-viewer-card">
              <span class="badge-institucional">ACCESOS RÁPIDOS INSTITUCIONALES POR ROL Y REGIÓN</span>
              <h4 style="margin: 0.5rem 0;">Perfiles Centrales RM (Supervisión Nacional y DECOFI)</h4>
              <p class="text-muted" style="font-size: 0.8rem; margin-bottom: 0.5rem;">
                Tienen acceso a todos los expedientes del país y aplican DECOFI / Tesorería General.
              </p>

              <div style="display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem;">
                <button
                  *ngFor="let c of cuentasDemoRM"
                  type="button"
                  class="btn btn-outline btn-sm"
                  style="justify-content: space-between; text-align: left; width: 100%; font-size: 0.82rem;"
                  (click)="autocompletarYEntrar(c.rut, c.password)"
                >
                  <span>
                    <strong>{{ c.etiquetaRol }}</strong> ({{ c.nombre }})
                  </span>
                  <span class="mono-badge">{{ c.rut }}</span>
                </button>
              </div>

              <h4 style="margin: 0.75rem 0 0.25rem 0; color: #1e3a8a;">Perfiles Regionales (Solo ven su Región)</h4>
              <p class="text-muted" style="font-size: 0.8rem; margin-bottom: 0.5rem;">
                Solo gestionan su dotación regional. La etapa se denomina <strong>«Autorización de Pago»</strong> y <strong>«Pago»</strong>.
              </p>

              <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                <button
                  *ngFor="let c of cuentasDemoRegionales"
                  type="button"
                  class="btn btn-outline btn-sm"
                  style="justify-content: space-between; text-align: left; width: 100%; font-size: 0.82rem; border-color: #3b82f6;"
                  (click)="autocompletarYEntrar(c.rut, c.password)"
                >
                  <span>
                    <strong>{{ c.etiquetaRol }}</strong> ({{ c.nombre }})
                  </span>
                  <span class="mono-badge">{{ c.rut }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VistaLoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly router = inject(Router);

  rut = '';
  password = '';

  readonly cuentasDemoRM = [
    {
      etiquetaRol: '🛠 Administrador Sistema',
      rol: 'Administrador',
      region: 'RM (Nacional)',
      rut: '18441463-5',
      password: '123456',
      nombre: 'Administrador General PDI'
    },
    {
      etiquetaRol: '👩‍👧 Postulante RM',
      rol: 'Postulante',
      region: 'RM (Metropolitana)',
      rut: '15432198-K',
      password: '123456',
      nombre: 'Carolina Soto Valdés'
    },
    {
      etiquetaRol: '1. Coordinador RM',
      rol: 'Coordinador',
      region: 'RM (Ve Todo / Filtra Regiones)',
      rut: '14222333-4',
      password: '123456',
      nombre: 'Marcela Rojas Fuentes'
    },
    {
      etiquetaRol: '2. Visador RM',
      rol: 'Visador',
      region: 'RM (Ve Todo)',
      rut: '13555666-7',
      password: '123456',
      nombre: 'Rodrigo Tapia Muñoz'
    },
    {
      etiquetaRol: '3. Logística RM',
      rol: 'Logistica',
      region: 'RM (Ve Todo)',
      rut: '12888999-0',
      password: '123456',
      nombre: 'Patricio Gómez Vera'
    },
    {
      etiquetaRol: '4. Finanzas RM (DECOFI Central)',
      rol: 'Finanzas',
      region: 'RM (Bolsa 60% y Evaluación DECOFI)',
      rut: '11444777-K',
      password: '123456',
      nombre: 'Claudia Mendoza Silva'
    },
    {
      etiquetaRol: '5. Tesorería RM (Pago General)',
      rol: 'Tesoreria',
      region: 'RM (Tesorería Central)',
      rut: '10999888-1',
      password: '123456',
      nombre: 'Roberto Pizarro Lagos'
    }
  ];

  readonly cuentasDemoRegionales = [
    {
      etiquetaRol: '👩‍👧 Postulante Valparaíso',
      rol: 'Postulante',
      region: 'V - Valparaíso',
      rut: '16555444-3',
      password: '123456',
      nombre: 'Daniela Herrera Muñoz'
    },
    {
      etiquetaRol: '1. Coordinador Valparaíso',
      rol: 'Coordinador',
      region: 'V - Valparaíso (Solo ve Región V)',
      rut: '14222333-5',
      password: '123456',
      nombre: 'Valeria Castro Soto'
    },
    {
      etiquetaRol: '2. Visador Valparaíso',
      rol: 'Visador',
      region: 'V - Valparaíso (Solo ve Región V)',
      rut: '13555666-8',
      password: '123456',
      nombre: 'Héctor Morales Silva'
    },
    {
      etiquetaRol: '3. Logística Valparaíso',
      rol: 'Logistica',
      region: 'V - Valparaíso (Solo ve Región V)',
      rut: '12888999-1',
      password: '123456',
      nombre: 'Sebastián Díaz Palma'
    },
    {
      etiquetaRol: '4. Autorización de Pago V',
      rol: 'Finanzas',
      region: 'V - Valparaíso (Autorización de Pago)',
      rut: '11444777-5',
      password: '123456',
      nombre: 'Lorena Ortiz Fuentes'
    },
    {
      etiquetaRol: '5. Pago Regional V',
      rol: 'Tesoreria',
      region: 'V - Valparaíso (Pago Regional)',
      rut: '10999888-5',
      password: '123456',
      nombre: 'Gonzalo Reyes Peña'
    },
    {
      etiquetaRol: '1. Coordinador Biobío',
      rol: 'Coordinador',
      region: 'VIII - Biobío (Solo ve Región VIII)',
      rut: '14222333-8',
      password: '123456',
      nombre: 'Mauricio Sanhueza Lira'
    }
  ];

  ngOnInit(): void {
    if (this.authService.estaAutenticado && this.authService.usuarioActual) {
      this.router.navigate([
        this.authService.obtenerRutaPorRol(this.authService.usuarioActual.rol)
      ]);
    }
  }

  autocompletarYEntrar(rutDemo: string, passDemo: string): void {
    this.rut = rutDemo;
    this.password = passDemo;
    this.ingresar();
  }

  ingresar(): void {
    if (!this.rut.trim() || !this.password.trim()) {
      this.notificacionService.alerta('Ingrese su RUT y Contraseña para iniciar sesión.');
      return;
    }

    this.authService
      .iniciarSesion({
        rut: this.rut.trim(),
        password: this.password.trim()
      })
      .subscribe({
        next: (usuario) => {
          this.notificacionService.exito(
            `Bienvenido/a ${usuario.nombreCompleto} — Perfil activo: ${usuario.rol}`
          );
          const destino = this.authService.obtenerRutaPorRol(usuario.rol);
          this.router.navigate([destino]);
        },
        error: (err) => {
          const mensaje = err.error?.mensaje || 'RUT o contraseña incorrecta.';
          this.notificacionService.alerta(mensaje);
        }
      });
  }
}
