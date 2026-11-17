import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ControlMensualDto,
  MESES_CATALOGO,
  REGIONES_CHILE
} from '../../core/models/sala-cuna.models';
import { ControlMensualService } from '../../core/services/control-mensual.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';

@Component({
  selector: 'app-vista-tesoreria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Encabezado Exclusivo del Rol Tesorería / Pago -->
      <div class="section-header">
        <div>
          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <span class="badge-institucional" style="background-color: #15803d; color: #ffffff;">
              {{ authService.esRegionMetropolitana ? 'ROL 5: TESORERÍA SALA CUNA PDI (PAGO FINAL CENTRAL)' : 'ROL 5: PAGO REGIONAL (' + authService.codigoRegionActual + ')' }}
            </span>
            <span class="mono-badge" [style.background]="authService.esRegionMetropolitana ? '#e0f2fe' : '#fef3c7'" [style.color]="authService.esRegionMetropolitana ? '#0369a1' : '#b45309'">
              📍 {{ authService.nombreRegionActual }}
            </span>
            <span class="side-badge" *ngIf="!authService.esRegionMetropolitana">
              🔒 Alcance Exclusivo: Solo pagos de su Región ({{ authService.codigoRegionActual }})
            </span>
            <span class="side-badge" *ngIf="authService.esRegionMetropolitana" style="background: #ecfdf5; color: #047857;">
              🌐 Supervisión Nacional: Pagos a Nivel País
            </span>
          </div>
          <h1>{{ authService.esRegionMetropolitana ? 'Ejecución de Pago Efectivo Final y Emisión de Comprobante' : 'Bandeja de Pago Regional y Emisión de Comprobante' }}</h1>
          <p class="subtitle">
            Reciba los expedientes autorizados por <strong>{{ authService.esRegionMetropolitana ? 'Finanzas / DECOFI' : 'Autorización de Pago' }}</strong>, ejecute el <strong>pago definitivo</strong> y emita el comprobante oficial.
          </p>
        </div>
      </div>

      <!-- KPIs Tesorería -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">Pendientes de Pago en Tesorería</span>
          <strong class="kpi-value kpi-warn">{{ pendientesTesoreria.length }}</strong>
          <small>Autorizados por Finanzas / DECOFI</small>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Pagos Efectivos Realizados</span>
          <strong class="kpi-value kpi-success">{{ pagadosTesoreria.length }}</strong>
          <small>Con comprobante de transferencia emitido</small>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Monto Total Pagado en Tesorería</span>
          <strong class="kpi-value">&#36;{{ calcularTotalPagado() | number:'1.0-0' }}</strong>
          <small>Suma acumulada desembolsada</small>
        </div>
      </div>

      <!-- BANDEJA DE EXPEDIENTES DERIVADOS POR FINANZAS PARA PAGO EFECTIVO -->
      <div class="card">
        <div class="card-header-flex">
          <div>
            <h2>1. Bandeja de Expedientes Autorizados por Finanzas / DECOFI Listos para Pago</h2>
            <p class="text-muted">
              Seleccione un expediente para registrar el comprobante de transferencia bancaria y certificar el pago definitivo.
            </p>
          </div>
          <button class="btn btn-sm btn-outline" (click)="cargarDatos()">Refrescar</button>
        </div>

        <div class="split-layout">
          <div class="split-main">
            <div *ngIf="pendientesTesoreria.length === 0" class="empty-state">
              <p>No existen expedientes pendientes de desembolso en Tesorería.</p>
            </div>

            <div class="table-responsive" *ngIf="pendientesTesoreria.length > 0">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Funcionaria / Región</th>
                    <th>Período</th>
                    <th>Imputación / DECOFI</th>
                    <th>Monto a Pagar</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    *ngFor="let exp of pendientesTesoreria"
                    [class.selected-row]="expedienteSeleccionado?.controlID === exp.controlID"
                  >
                    <td><strong>#{{ exp.controlID }}</strong></td>
                    <td>
                      <div><strong>{{ exp.funcionarioNombreCompleto }}</strong></div>
                      <small class="mono-badge">{{ exp.funcionarioRut }}</small>
                      <small class="side-badge" style="margin-left: 4px;">{{ exp.codigoRegion }}</small>
                    </td>
                    <td><strong>{{ obtenerNombreMes(exp.mes) }} {{ exp.anio }}</strong></td>
                    <td>
                      <span class="badge-estado" [ngClass]="exp.estadoFlujo === 'Arrastre Presupuestario' ? 'badge-pendiente' : 'badge-aprobada'">
                        {{ exp.estadoFlujo }} ({{ exp.anioImputacionPresupuestaria || exp.anio }})
                      </span>
                      <div><small>{{ exp.evaluacionDecofi }}</small></div>
                    </td>
                    <td>
                      <strong style="color: var(--success);">
                        &#36;{{ exp.montoProporcionalCalculado | number:'1.0-0' }}
                      </strong>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-primary" (click)="seleccionarParaPago(exp)">
                        Ejecutar Pago Final
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Panel Lateral de Ejecución de Pago -->
          <div class="split-side" *ngIf="expedienteSeleccionado as sel">
            <div class="folder-viewer-card">
              <div class="folder-header">
                <div>
                  <span class="badge-institucional">DESEMBOLSO TESORERÍA #{{ sel.controlID }}</span>
                  <h3>{{ sel.funcionarioNombreCompleto }}</h3>
                  <small>
                    RUT: {{ sel.funcionarioRut }} | Región: <strong>{{ sel.codigoRegion }}</strong> | Monto: <strong>&#36;{{ sel.montoProporcionalCalculado | number:'1.0-0' }}</strong>
                  </small>
                </div>
                <button class="btn-close" (click)="expedienteSeleccionado = null">✕</button>
              </div>

              <div class="form-group">
                <label>Responsable de Tesorería *</label>
                <input
                  type="text"
                  class="input-control"
                  [(ngModel)]="nombreResponsableTesoreria"
                  placeholder="Ej: Roberto Carlos Pizarro Lagos"
                />
              </div>

              <div class="form-group" style="margin-top: 0.65rem;">
                <label>N° de Comprobante de Transferencia / Egreso de Tesorería *</label>
                <input
                  type="text"
                  class="input-control"
                  [(ngModel)]="comprobanteTesoreria"
                  placeholder="Ej: TES-TRANSF-2026-001"
                />
              </div>

              <div class="form-group" style="margin-top: 0.65rem;">
                <label>Observaciones de Tesorería</label>
                <input
                  type="text"
                  class="input-control"
                  [(ngModel)]="observacionesTesoreria"
                />
              </div>

              <div class="formal-doc-preview" style="margin-top: 1rem;">
                <span class="preview-tag">CERTIFICADO DE PAGO A EMITIR:</span>
                <blockquote class="formal-quote">
                  "Se ejecuta y certifica pago en Tesorería a {{ sel.funcionarioNombreCompleto }} RUT {{ sel.funcionarioRut }} por un monto de &#36;{{ sel.montoProporcionalCalculado | number:'1.0-0' }}. Comprobante: {{ comprobanteTesoreria }}. Atentamente {{ nombreResponsableTesoreria }}"
                </blockquote>
              </div>

              <div class="resolution-actions">
                <button
                  class="btn btn-success"
                  (click)="confirmarPagoEfectivo(sel)"
                >
                  ✓ Confirmar Transferencia y Emitir Comprobante de Pago Final
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- HISTORIAL DE PAGOS EFECTUADOS POR TESORERÍA -->
      <div class="card">
        <h2>2. Historial de Pagos Efectivos y Comprobantes Emitidos por Tesorería</h2>
        <div *ngIf="pagadosTesoreria.length === 0" class="empty-state">
          <p>Aún no se han registrado pagos finales en Tesorería.</p>
        </div>

        <div class="table-responsive" *ngIf="pagadosTesoreria.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Funcionaria / Región</th>
                <th>Período</th>
                <th>Año Imputado</th>
                <th>Monto Pagado</th>
                <th>Certificado / Comprobante de Tesorería</th>
                <th>Fecha Pago</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of pagadosTesoreria">
                <td><strong>#{{ p.controlID }}</strong></td>
                <td>
                  <div><strong>{{ p.funcionarioNombreCompleto }}</strong></div>
                  <small class="mono-badge">{{ p.funcionarioRut }}</small>
                  <small class="side-badge" style="margin-left: 4px;">{{ p.codigoRegion }}</small>
                </td>
                <td>{{ obtenerNombreMes(p.mes) }} {{ p.anio }}</td>
                <td><strong>{{ p.anioImputacionPresupuestaria || p.anio }}</strong></td>
                <td>
                  <strong style="color: var(--success);">
                    &#36;{{ p.montoProporcionalCalculado | number:'1.0-0' }}
                  </strong>
                </td>
                <td>
                  <div class="formal-doc-cell">{{ p.comprobanteTesoreria }}</div>
                </td>
                <td>{{ p.fechaEjecucionFinanzas | date:'dd/MM/yyyy HH:mm' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class VistaTesoreriaComponent implements OnInit {
  private readonly controlMensualService = inject(ControlMensualService);
  readonly authService = inject(AuthService);
  private readonly notificacionService = inject(NotificacionService);

  readonly meses = MESES_CATALOGO;

  pendientesTesoreria: ControlMensualDto[] = [];
  pagadosTesoreria: ControlMensualDto[] = [];
  expedienteSeleccionado: ControlMensualDto | null = null;

  nombreResponsableTesoreria = 'Roberto Carlos Pizarro Lagos';
  comprobanteTesoreria = '';
  observacionesTesoreria = 'Transferencia electrónica ejecutada por Tesorería Bienestar PDI.';

  ngOnInit(): void {
    const sesion = this.authService.usuarioActual;
    if (sesion) {
      this.nombreResponsableTesoreria = sesion.nombreCompleto;
    }
    this.cargarDatos();
  }

  cargarDatos(): void {
    const regFiltro = this.authService.esRegionMetropolitana
      ? undefined
      : this.authService.codigoRegionActual;

    this.controlMensualService.listarControles({ codigoRegion: regFiltro }).subscribe({
      next: (todos) => {
        this.pendientesTesoreria = todos.filter(
          c => c.estadoFlujo === 'Devengado Finanzas' || c.estadoFlujo === 'Arrastre Presupuestario'
        );
        this.pagadosTesoreria = todos.filter(
          c => c.estadoFlujo === 'Pagado Tesoreria' || c.estadoFlujo === 'Pagado Finanzas'
        );
      }
    });
  }

  seleccionarParaPago(exp: ControlMensualDto): void {
    this.expedienteSeleccionado = exp;
    const anioImp = exp.anioImputacionPresupuestaria || exp.anio;
    this.comprobanteTesoreria = `TES-PDI-${anioImp}-00${exp.controlID}`;
  }

  confirmarPagoEfectivo(exp: ControlMensualDto): void {
    if (!this.nombreResponsableTesoreria.trim() || !this.comprobanteTesoreria.trim()) {
      this.notificacionService.alerta('Complete el responsable y el número de comprobante de Tesorería.');
      return;
    }

    this.controlMensualService
      .avanzarEtapaCircuito(exp.controlID, {
        rolAccion: 'TESORERIA',
        accion: 'PAGAR_TESORERIA',
        nombreResponsable: this.nombreResponsableTesoreria.trim(),
        numeroDocumentoCompromiso: this.comprobanteTesoreria.trim(),
        observaciones: this.observacionesTesoreria.trim()
      })
      .subscribe({
        next: () => {
          this.notificacionService.exito(
            `Pago efectivo registrado en Tesorería con comprobante ${this.comprobanteTesoreria}.`
          );
          this.expedienteSeleccionado = null;
          this.cargarDatos();
        }
      });
  }

  calcularTotalPagado(): number {
    return this.pagadosTesoreria.reduce(
      (acc, item) => acc + (item.montoProporcionalCalculado || 0),
      0
    );
  }

  obtenerNombreMes(mes: number): string {
    return this.meses.find(m => m.numero === mes)?.nombre || `Mes ${mes}`;
  }
}
