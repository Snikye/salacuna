import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  ControlMensualDto,
  MESES_CATALOGO,
  REGIONES_CHILE,
  UsuarioSistemaDto
} from '../../core/models/sala-cuna.models';
import { AuthService } from '../../core/services/auth.service';
import { ControlMensualService } from '../../core/services/control-mensual.service';
import { UsuarioSistemaService } from '../../core/services/usuario-sistema.service';
import { NotificacionService } from '../../core/services/notificacion.service';

@Component({
  selector: 'app-vista-logistica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Encabezado de Rol Logística (Módulo 3 - Etapa 3) -->
      <div class="section-header">
        <div>
          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <span class="badge-institucional" style="background-color: #3b0764; color: #fde047;">
              MÓDULO 3 (ETAPA 3): LOGÍSTICA SALA CUNA PDI
            </span>
            <span class="mono-badge" [style.background]="authService.esRegionMetropolitana ? '#e0f2fe' : '#fef3c7'" [style.color]="authService.esRegionMetropolitana ? '#0369a1' : '#b45309'">
              📍 {{ authService.nombreRegionActual }}
            </span>
            <span class="side-badge" *ngIf="!authService.esRegionMetropolitana">
              🔒 Alcance Exclusivo: Solo expedientes de su Región ({{ authService.codigoRegionActual }})
            </span>
            <span class="side-badge" *ngIf="authService.esRegionMetropolitana" style="background: #ecfdf5; color: #047857;">
              🌐 Alcance Nacional: Supervisión Global (16 Regiones)
            </span>
          </div>
          <h1>Compromiso Oficial de Pago y Control de Disponibilidad Regional</h1>
          <p class="subtitle">
            Reciba los expedientes con <strong>Visado Conforme</strong>, asuma y genere el <strong>compromiso de pago oficial</strong> imputando al presupuesto de la región correspondiente (controlando que no exista sobregiro) y derive a <strong>{{ authService.esRegionMetropolitana ? 'Finanzas y Tesorería (DECOFI)' : 'Autorización de Pago y Pago' }}</strong>.
          </p>
        </div>
      </div>

      <!-- KPIs Logística -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">Pendientes en Logística</span>
          <strong class="kpi-value kpi-warn">{{ contarPorEstado('Visado Conforme') }}</strong>
          <small>Visados listos para compromiso</small>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Con Compromiso Oficial</span>
          <strong class="kpi-value kpi-success">{{ contarPorEstado('Compromiso Logistica') }}</strong>
          <small>Derivados a Finanzas y Tesorería</small>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Ejecutados en Finanzas / DECOFI</span>
          <strong class="kpi-value">{{ contarPorEstado('Pagado Finanzas') + contarPorEstado('Arrastre Presupuestario') }}</strong>
          <small>Devengados o arrastrados</small>
        </div>
      </div>

      <!-- Bandeja de Logística -->
      <div class="card">
        <div class="card-header-flex">
          <h2>Bandeja de Compromiso Oficial de Pago — Área de Logística</h2>
          <div class="filter-bar">
            <div *ngIf="authService.esRegionMetropolitana" style="display: flex; align-items: center; gap: 0.35rem;">
              <label>Región:</label>
              <select class="input-control select-sm" [(ngModel)]="filtroRegion" (change)="cargarExpedientes()">
                <option value="">Todas las Regiones</option>
                <option *ngFor="let r of regionesChile" [value]="r.codigo">{{ r.nombre }}</option>
              </select>
            </div>
            <label>Filtrar Vista:</label>
            <select
              class="input-control select-sm"
              [(ngModel)]="filtroEstadoFlujo"
              (change)="cargarExpedientes()"
            >
              <option value="Visado Conforme">Pendientes de Compromiso (Visado Conforme)</option>
              <option value="Compromiso Logistica">Comprometidos (En Finanzas)</option>
              <option value="">Todos los Expedientes</option>
            </select>
            <button class="btn btn-sm btn-outline" (click)="cargarExpedientes()">Refrescar</button>
          </div>
        </div>

        <div class="split-layout">
          <div class="split-main">
            <div *ngIf="expedientes.length === 0" class="empty-state">
              <p>No existen expedientes en la bandeja seleccionada de Logística.</p>
            </div>

            <div class="table-responsive" *ngIf="expedientes.length > 0">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Funcionaria / Región</th>
                    <th>Período</th>
                    <th>Días Efectivos</th>
                    <th>Monto a Comprometer</th>
                    <th>N° Compromiso</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    *ngFor="let exp of expedientes"
                    [class.selected-row]="expedienteSeleccionado?.controlID === exp.controlID"
                  >
                    <td><strong>#{{ exp.controlID }}</strong></td>
                    <td>
                      <div><strong>{{ exp.funcionarioNombreCompleto }}</strong></div>
                      <small class="mono-badge">{{ exp.funcionarioRut }}</small>
                      <small class="side-badge" style="margin-left: 4px;">{{ exp.codigoRegion }}</small>
                    </td>
                    <td><strong>{{ obtenerNombreMes(exp.mes) }} {{ exp.anio }}</strong></td>
                    <td>{{ exp.diasEfectivos }} / 30 días</td>
                    <td>
                      <strong style="color: var(--primary);">
                        &#36;{{ exp.montoProporcionalCalculado | number:'1.0-0' }}
                      </strong>
                    </td>
                    <td>
                      <span *ngIf="exp.numeroCompromisoPago" class="mono-badge">{{ exp.numeroCompromisoPago }}</span>
                      <span *ngIf="!exp.numeroCompromisoPago" class="text-muted">Pendiente</span>
                    </td>
                    <td>
                      <span class="badge-estado" [ngClass]="exp.estadoFlujo === 'Visado Conforme' ? 'badge-pendiente' : 'badge-aprobada'">
                        {{ exp.estadoFlujo }}
                      </span>
                    </td>
                    <td>
                      <button
                        *ngIf="exp.estadoFlujo === 'Visado Conforme'"
                        class="btn btn-sm btn-primary"
                        (click)="seleccionarParaCompromiso(exp)"
                      >
                        Generar Compromiso
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Panel Lateral para Generar Compromiso Oficial -->
          <div class="split-side" *ngIf="expedienteSeleccionado as sel">
            <div class="folder-viewer-card">
              <div class="folder-header">
                <div>
                  <span class="badge-institucional">COMPROMISO OFICIAL #{{ sel.controlID }} ({{ sel.codigoRegion }})</span>
                  <h3>{{ sel.funcionarioNombreCompleto }}</h3>
                  <small>
                    RUT: {{ sel.funcionarioRut }} | Resolución: <strong>{{ sel.numeroResolucion || 'Vigente' }}</strong> | Período: {{ obtenerNombreMes(sel.mes) }} {{ sel.anio }}
                  </small>
                </div>
                <button class="btn-close" (click)="expedienteSeleccionado = null">✕</button>
              </div>

              <div class="visador-days-box">
                <h4>Detalle Presupuestario a Comprometer</h4>
                <div class="days-breakdown-grid">
                  <div class="breakdown-item">
                    <span>Región Imputación:</span>
                    <strong>{{ sel.codigoRegion }}</strong>
                  </div>
                  <div class="breakdown-item">
                    <span>Días Efectivos:</span>
                    <strong>{{ sel.diasEfectivos }} / 30</strong>
                  </div>
                  <div class="breakdown-item">
                    <span>Monto Compromiso:</span>
                    <strong style="color: var(--success);">&#36;{{ sel.montoProporcionalCalculado | number:'1.0-0' }}</strong>
                  </div>
                </div>
              </div>

              <div class="resolution-box" style="margin-top: 1rem;">
                <h4>Emisión de Compromiso Oficial de Pago (Logística)</h4>
                <div class="form-group">
                  <label>Nombre del Responsable de Logística *</label>
                  <input
                    type="text"
                    class="input-control"
                    [(ngModel)]="nombreResponsableLogistica"
                    placeholder="Ej: Patricio Esteban Gómez Vera"
                  />
                </div>

                <div class="form-group" style="margin-top: 0.65rem;">
                  <label>N° Documento de Compromiso Presupuestario *</label>
                  <input
                    type="text"
                    class="input-control"
                    [(ngModel)]="numeroCompromiso"
                    placeholder="Ej: COMP-LOG-2026-001"
                  />
                </div>

                <div class="form-group" style="margin-top: 0.65rem;">
                  <label>Observaciones de Logística</label>
                  <input
                    type="text"
                    class="input-control"
                    [(ngModel)]="observacionesLogistica"
                    placeholder="Compromiso presupuestario emitido sin sobregiro regional."
                  />
                </div>

                <div class="resolution-actions">
                  <button
                    class="btn btn-primary"
                    [disabled]="!nombreResponsableLogistica.trim()"
                    (click)="confirmarCompromisoYDerivar(sel)"
                  >
                    ✓ Generar Compromiso Oficial y Derivar a Finanzas / Tesorería →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Visor de PDF -->
      <div class="modal-backdrop" *ngIf="pdfPreviewUrl">
        <div class="modal-pdf-container">
          <div class="modal-pdf-header">
            <h3>Respaldo Documental: {{ pdfPreviewTitulo }}</h3>
            <div class="modal-pdf-actions">
              <button class="btn btn-sm btn-danger" (click)="cerrarPreviewPdf()">Cerrar ✕</button>
            </div>
          </div>
          <div class="modal-pdf-body">
            <iframe [src]="pdfPreviewUrl" title="Visor PDF Logística"></iframe>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VistaLogisticaComponent implements OnInit {
  private readonly controlMensualService = inject(ControlMensualService);
  private readonly usuarioSistemaService = inject(UsuarioSistemaService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly authService = inject(AuthService);

  readonly meses = MESES_CATALOGO;
  readonly regionesChile = REGIONES_CHILE;

  todosLosControles: ControlMensualDto[] = [];
  expedientes: ControlMensualDto[] = [];
  filtroEstadoFlujo = 'Visado Conforme';
  filtroRegion = '';

  expedienteSeleccionado: ControlMensualDto | null = null;
  usuariosLogistica: UsuarioSistemaDto[] = [];
  nombreResponsableLogistica = 'Patricio Esteban Gómez Vera';
  numeroCompromiso = '';
  observacionesLogistica = 'Compromiso oficial de pago emitido por Logística.';

  pdfPreviewUrl: SafeResourceUrl | null = null;
  pdfPreviewRawUrl = '';
  pdfPreviewTitulo = '';

  ngOnInit(): void {
    if (this.authService.usuarioActual) {
      this.nombreResponsableLogistica = this.authService.usuarioActual.nombreCompleto;
      this.notificacionService.establecerUsuarioResponsable(
        `${this.authService.usuarioActual.nombreCompleto} (Logística - ${this.authService.codigoRegionActual})`
      );
    }

    this.usuarioSistemaService.listar('Logistica').subscribe({
      next: (lista) => {
        this.usuariosLogistica = lista;
        if (!this.authService.usuarioActual && lista.length > 0) {
          this.nombreResponsableLogistica = lista[0].nombreCompleto;
        }
      }
    });
    this.cargarExpedientes();
  }

  cargarExpedientes(): void {
    const regFiltro = this.authService.esRegionMetropolitana
      ? (this.filtroRegion || undefined)
      : this.authService.codigoRegionActual;

    this.controlMensualService.listarControles({ codigoRegion: regFiltro }).subscribe({
      next: (todos) => {
        this.todosLosControles = todos;
        this.expedientes = this.filtroEstadoFlujo
          ? todos.filter(c => c.estadoFlujo === this.filtroEstadoFlujo)
          : todos;
      }
    });
  }

  seleccionarParaCompromiso(exp: ControlMensualDto): void {
    this.expedienteSeleccionado = exp;
    this.numeroCompromiso = `COMP-LOG-${exp.anio}-00${exp.controlID}`;
  }

  confirmarCompromisoYDerivar(exp: ControlMensualDto): void {
    if (!this.nombreResponsableLogistica.trim()) {
      this.notificacionService.alerta('Debe registrar el nombre del responsable de Logística.');
      return;
    }

    this.controlMensualService
      .avanzarEtapaCircuito(exp.controlID, {
        rolAccion: 'LOGISTICA',
        accion: 'COMPROMETER',
        nombreResponsable: this.nombreResponsableLogistica.trim(),
        numeroDocumentoCompromiso: this.numeroCompromiso.trim() || `COMP-LOG-${exp.anio}-${exp.controlID}`,
        observaciones: this.observacionesLogistica.trim()
      })
      .subscribe({
        next: (actualizado) => {
          this.notificacionService.exito(
            `Compromiso oficial ${actualizado.numeroCompromisoPago} generado en región ${actualizado.codigoRegion}. Derivado a Finanzas y Tesorería.`
          );
          this.expedienteSeleccionado = null;
          this.cargarExpedientes();
        }
      });
  }

  contarPorEstado(estado: string): number {
    return this.todosLosControles.filter(c => c.estadoFlujo === estado).length;
  }

  obtenerNombreMes(mes: number): string {
    return this.meses.find(m => m.numero === mes)?.nombre || `Mes ${mes}`;
  }

  previsualizarPdf(url: string, titulo: string): void {
    this.pdfPreviewRawUrl = url;
    this.pdfPreviewTitulo = titulo;
    this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  cerrarPreviewPdf(): void {
    this.pdfPreviewUrl = null;
    this.pdfPreviewRawUrl = '';
  }
}
