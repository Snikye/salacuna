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
  selector: 'app-vista-visador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Encabezado de Rol Visador (Módulo 3 - Etapa 2) -->
      <div class="section-header">
        <div>
          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <span class="badge-institucional badge-admin">MÓDULO 3 (ETAPA 2): VISADOR SALA CUNA PDI</span>
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
          <h1>Verificación de Información, Cálculo Proporcional Día 30 y Derivación a Logística</h1>
          <p class="subtitle">
            Verifique la declaración del <strong>Día 30</strong>, los días descontados (Feriado Legal, Administrativos, Licencia Médica) y el monto proporcional calculado. Si existen errores, <strong>devuelva al Coordinador</strong> con observaciones; si está correcto, <strong>avance el flujo a Logística</strong>.
          </p>
        </div>
      </div>

      <!-- KPIs del Visador -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">Con Visto Bueno Coordinador</span>
          <strong class="kpi-value kpi-warn">{{ contarPorEstado('Visto Bueno Coordinador') }}</strong>
          <small>Listos para visación</small>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Visados Conformes (En Logística)</span>
          <strong class="kpi-value kpi-success">{{ contarPorEstado('Visado Conforme') }}</strong>
          <small>Avanzados a compromiso de pago</small>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Devueltos a Coordinador</span>
          <strong class="kpi-value kpi-danger">{{ contarPorEstado('Devuelto a Coordinador') }}</strong>
          <small>Con observaciones de corrección</small>
        </div>
      </div>

      <!-- Bandeja Principal del Visador -->
      <div class="card">
        <div class="card-header-flex">
          <h2>Bandeja de Visación — Circuito Administrativo (Módulo 3)</h2>
          <div class="filter-bar">
            <div *ngIf="authService.esRegionMetropolitana" style="display: flex; align-items: center; gap: 0.35rem;">
              <label>Región:</label>
              <select class="input-control select-sm" [(ngModel)]="filtroRegion" (change)="cargarExpedientes()">
                <option value="">Todas las Regiones</option>
                <option *ngFor="let r of regionesChile" [value]="r.codigo">{{ r.nombre }}</option>
              </select>
            </div>
            <label>Filtrar Estado:</label>
            <select
              class="input-control select-sm"
              [(ngModel)]="filtroEstadoFlujo"
              (change)="cargarExpedientes()"
            >
              <option value="Visto Bueno Coordinador">Pendientes de Visar (Con Visto Bueno Coordinador)</option>
              <option value="Devuelto a Coordinador">Devueltos a Coordinador</option>
              <option value="Visado Conforme">Visados Conformes (En Logística)</option>
              <option value="">Todos los Estados</option>
            </select>
            <button class="btn btn-sm btn-outline" (click)="cargarExpedientes()">Refrescar</button>
          </div>
        </div>

        <div class="split-layout">
          <div class="split-main">
            <div *ngIf="expedientes.length === 0" class="empty-state">
              <p>No existen expedientes en el filtro seleccionado.</p>
            </div>

            <div class="table-responsive" *ngIf="expedientes.length > 0">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Funcionaria / Región / Resolución</th>
                    <th>Período</th>
                    <th>Días Efectivos (Base 30)</th>
                    <th>Monto Proporcional</th>
                    <th>PDF Respaldo</th>
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
                      <div><small class="text-muted">Res: {{ exp.numeroResolucion || 'Vigente' }}</small></div>
                    </td>
                    <td><strong>{{ obtenerNombreMes(exp.mes) }} {{ exp.anio }}</strong></td>
                    <td>
                      <div class="days-summary-pills">
                        <span class="day-pill">Efectivos: <strong>{{ exp.diasEfectivos }}/30</strong></span>
                        <span class="day-pill" *ngIf="exp.diasFeriadoLegal > 0">Fer: {{ exp.diasFeriadoLegal }}</span>
                        <span class="day-pill" *ngIf="exp.diasAdministrativos > 0">Adm: {{ exp.diasAdministrativos }}</span>
                        <span class="day-pill warn" *ngIf="exp.diasLicenciaMedica > 0">Lic: {{ exp.diasLicenciaMedica }}</span>
                      </div>
                    </td>
                    <td>
                      <strong style="color: var(--primary);">
                        &#36;{{ exp.montoProporcionalCalculado | number:'1.0-0' }}
                      </strong>
                    </td>
                    <td>
                      <button
                        *ngIf="exp.rutaArchivoRespaldo"
                        class="btn btn-sm btn-outline"
                        (click)="previsualizarPdf(obtenerUrlPdf(exp.controlID), 'Respaldo_' + exp.funcionarioRut)"
                      >
                        Ver PDF
                      </button>
                      <span *ngIf="!exp.rutaArchivoRespaldo" class="text-muted">Sin causal</span>
                    </td>
                    <td>
                      <span class="badge-estado" [ngClass]="obtenerClaseEstado(exp.estadoFlujo)">
                        {{ exp.estadoFlujo }}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-primary" (click)="seleccionarExpediente(exp)">
                        Revisar / Visar
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Panel de Revisión y Dictamen del Visador -->
          <div class="split-side" *ngIf="expedienteSeleccionado as sel">
            <div class="folder-viewer-card">
              <div class="folder-header">
                <div>
                  <span class="badge-institucional">EXPEDIENTE #{{ sel.controlID }} ({{ sel.codigoRegion }})</span>
                  <h3>{{ sel.funcionarioNombreCompleto }}</h3>
                  <small>
                    RUT: {{ sel.funcionarioRut }} | N° SIDE: <strong>{{ sel.funcionarioNumeroSide || 'S/N' }}</strong> | Resolución: <strong>{{ sel.numeroResolucion || 'Vigente' }}</strong>
                  </small>
                </div>
                <button class="btn-close" (click)="expedienteSeleccionado = null">✕</button>
              </div>

              <div class="visador-days-box">
                <h4>Verificación del Cálculo Proporcional Día 30 ({{ obtenerNombreMes(sel.mes) }} {{ sel.anio }})</h4>
                <div class="days-breakdown-grid">
                  <div class="breakdown-item">
                    <span>Monto Base (30 días):</span>
                    <strong>&#36;{{ sel.montoMensualBase | number:'1.0-0' }}</strong>
                  </div>
                  <div class="breakdown-item">
                    <span>Feriado Legal:</span>
                    <strong>{{ sel.diasFeriadoLegal }} días</strong>
                  </div>
                  <div class="breakdown-item">
                    <span>Días Administrativos:</span>
                    <strong>{{ sel.diasAdministrativos }} días</strong>
                  </div>
                  <div class="breakdown-item">
                    <span>Licencia Médica:</span>
                    <strong>{{ sel.diasLicenciaMedica }} días</strong>
                  </div>
                  <div class="breakdown-item">
                    <span>Días Efectivos:</span>
                    <strong>{{ sel.diasEfectivos }} / 30 días</strong>
                  </div>
                  <div class="breakdown-item">
                    <span>Monto a Pagar:</span>
                    <strong style="color: var(--success);">&#36;{{ sel.montoProporcionalCalculado | number:'1.0-0' }}</strong>
                  </div>
                </div>
              </div>

              <div class="folder-files-list" style="margin-top: 0.85rem;" *ngIf="sel.rutaArchivoRespaldo">
                <h4>Documento PDF Adjunto en Notificación Día 30:</h4>
                <div class="folder-file-item">
                  <div class="folder-file-info">
                    <span class="file-icon">PDF</span>
                    <div>
                      <strong>Respaldo de Causales / Asistencia Día 30</strong>
                    </div>
                  </div>
                  <div class="folder-file-btns">
                    <button
                      class="btn btn-sm btn-primary"
                      (click)="previsualizarPdf(obtenerUrlPdf(sel.controlID), 'Respaldo_' + sel.funcionarioNombreCompleto)"
                    >
                      Abrir Visor PDF
                    </button>
                  </div>
                </div>
              </div>

              <div class="resolution-box">
                <h4>Dictamen del Visador</h4>
                <div class="form-group">
                  <label>Visador Responsable:</label>
                  <input
                    type="text"
                    class="input-control"
                    [(ngModel)]="nombreVisador"
                    placeholder="Nombre del Visador"
                  />
                </div>

                <div class="form-group" style="margin-top: 0.65rem;">
                  <label>
                    Observaciones del Visador (Obligatorio si devuelve el expediente al Coordinador):
                  </label>
                  <textarea
                    rows="3"
                    class="input-control"
                    [(ngModel)]="observacionVisador"
                    placeholder="Indique conformidad o detalle los errores para corrección por el Coordinador..."
                  ></textarea>
                </div>

                <div class="resolution-actions">
                  <button
                    class="btn btn-success"
                    (click)="procesarDecisionVisador(sel, true)"
                  >
                    ✓ Visar Conforme y Avanzar a Logística →
                  </button>
                  <button
                    class="btn btn-danger"
                    (click)="procesarDecisionVisador(sel, false)"
                  >
                    ↩ Devolver al Coordinador
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
            <h3>Revisión Documental del Visador: {{ pdfPreviewTitulo }}</h3>
            <div class="modal-pdf-actions" style="display: flex; gap: 0.5rem; align-items: center;">
              <a
                *ngIf="pdfDescargaUrl"
                [href]="pdfDescargaUrl"
                target="_blank"
                download
                class="btn btn-sm btn-outline"
                style="color: #ffffff; border-color: #cbd5e1;"
                title="Descargar respaldo a su equipo"
              >
                ⬇ Descargar
              </a>
              <button class="btn btn-sm btn-danger" (click)="cerrarPreviewPdf()">Cerrar ✕</button>
            </div>
          </div>
          <div class="modal-pdf-body">
            <iframe [src]="pdfPreviewUrl" title="Visor PDF Visador"></iframe>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VistaVisadorComponent implements OnInit {
  private readonly controlMensualService = inject(ControlMensualService);
  private readonly usuarioSistemaService = inject(UsuarioSistemaService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly authService = inject(AuthService);

  readonly meses = MESES_CATALOGO;
  readonly regionesChile = REGIONES_CHILE;

  todosLosControles: ControlMensualDto[] = [];
  expedientes: ControlMensualDto[] = [];
  filtroEstadoFlujo = 'Visto Bueno Coordinador';
  filtroRegion = '';

  expedienteSeleccionado: ControlMensualDto | null = null;
  visadores: UsuarioSistemaDto[] = [];
  nombreVisador = 'Rodrigo Andrés Tapia Muñoz (Visador)';
  observacionVisador = '';

  pdfPreviewUrl: SafeResourceUrl | null = null;
  pdfPreviewRawUrl = '';
  pdfDescargaUrl = '';
  pdfPreviewTitulo = '';

  ngOnInit(): void {
    if (this.authService.usuarioActual) {
      this.nombreVisador = this.authService.usuarioActual.nombreCompleto;
      this.notificacionService.establecerUsuarioResponsable(
        `${this.authService.usuarioActual.nombreCompleto} (Visador - ${this.authService.codigoRegionActual})`
      );
    }

    this.usuarioSistemaService.listar('Visador').subscribe({
      next: (lista) => {
        this.visadores = lista;
        if (!this.authService.usuarioActual && lista.length > 0) {
          this.nombreVisador = lista[0].nombreCompleto;
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

  seleccionarExpediente(exp: ControlMensualDto): void {
    this.expedienteSeleccionado = exp;
    this.observacionVisador = exp.observacionVisador || '';
  }

  procesarDecisionVisador(exp: ControlMensualDto, aprobar: boolean): void {
    if (!aprobar && !this.observacionVisador.trim()) {
      this.notificacionService.alerta(
        'Para devolver el expediente al Coordinador, debe ingresar las observaciones específicas del error encontrado.'
      );
      return;
    }

    this.controlMensualService
      .avanzarEtapaCircuito(exp.controlID, {
        rolAccion: 'VISADOR',
        accion: aprobar ? 'APROBAR' : 'DEVOLVER',
        nombreResponsable: this.nombreVisador.trim() || this.notificacionService.usuarioActual,
        observaciones: this.observacionVisador.trim() || (aprobar ? 'Visado conforme por Visador.' : null)
      })
      .subscribe({
        next: (actualizado) => {
          this.notificacionService.exito(
            aprobar
              ? `Expediente #${actualizado.controlID} visado conforme y derivado a Logística.`
              : `Expediente #${actualizado.controlID} devuelto al Coordinador para corrección.`
          );
          this.expedienteSeleccionado = null;
          this.cargarExpedientes();
        }
      });
  }

  contarPorEstado(estado: string): number {
    return this.todosLosControles.filter(c => c.estadoFlujo === estado).length;
  }

  obtenerUrlPdf(controlId: number): string {
    return this.controlMensualService.obtenerUrlVisualizacion(controlId);
  }

  obtenerUrlDescargaPdf(controlId: number): string {
    return this.controlMensualService.obtenerUrlArchivoRespaldo(controlId);
  }

  obtenerNombreMes(mes: number): string {
    return this.meses.find(m => m.numero === mes)?.nombre || `Mes ${mes}`;
  }

  obtenerClaseEstado(estado: string): string {
    if (estado === 'Visado Conforme' || estado === 'Compromiso Logistica' || estado === 'Pagado Finanzas') {
      return 'badge-aprobada';
    }
    if (estado === 'Devuelto a Coordinador') return 'badge-rechazada';
    return 'badge-pendiente';
  }

  previsualizarPdf(url: string, titulo: string): void {
    this.pdfPreviewRawUrl = url;
    this.pdfDescargaUrl = url.replace('/ver', '/descargar');
    this.pdfPreviewTitulo = titulo;
    this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  cerrarPreviewPdf(): void {
    this.pdfPreviewUrl = null;
    this.pdfPreviewRawUrl = '';
    this.pdfDescargaUrl = '';
  }
}
