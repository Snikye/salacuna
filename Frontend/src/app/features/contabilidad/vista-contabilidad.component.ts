import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ControlMensualDto,
  MESES_CATALOGO,
  REGIONES_CHILE,
  ResumenPresupuestoAnualDto,
  UsuarioSistemaDto
} from '../../core/models/sala-cuna.models';
import { AuthService } from '../../core/services/auth.service';
import { ControlMensualService } from '../../core/services/control-mensual.service';
import { UsuarioSistemaService } from '../../core/services/usuario-sistema.service';
import { NotificacionService } from '../../core/services/notificacion.service';

@Component({
  selector: 'app-vista-contabilidad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Encabezado Módulos 3 (Finanzas / DECOFI o Autorización de Pago) y 4 (Presupuesto) -->
      <div class="section-header">
        <div>
          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <span class="badge-institucional badge-contab-header">
              {{ authService.esRegionMetropolitana ? 'MÓDULO 3 (ETAPA 4: FINANZAS / DECOFI CENTRAL)' : 'MÓDULO 3 (ETAPA 4: AUTORIZACIÓN DE PAGO REGIONAL)' }}
            </span>
            <span class="mono-badge" [style.background]="authService.esRegionMetropolitana ? '#e0f2fe' : '#fef3c7'" [style.color]="authService.esRegionMetropolitana ? '#0369a1' : '#b45309'">
              📍 {{ authService.nombreRegionActual }}
            </span>
            <span class="side-badge" *ngIf="!authService.esRegionMetropolitana">
              🔒 Alcance Exclusivo: Solo expedientes de su Región ({{ authService.codigoRegionActual }})
            </span>
            <span class="side-badge" *ngIf="authService.esRegionMetropolitana" style="background: #ecfdf5; color: #047857;">
              🌐 Supervisión Nacional DECOFI (60% RM / 40% Regiones)
            </span>
          </div>
          <h1>{{ authService.esRegionMetropolitana ? 'Finanzas Central, Evaluación DECOFI, Arrastre y Presupuesto 60/40' : 'Bandeja de Autorización de Pago y Saldo Regional' }}</h1>
          <p class="subtitle">
            <span *ngIf="authService.esRegionMetropolitana">
              Ejecute el <strong>devengo</strong> o el <strong>arrastre presupuestario</strong> bajo evaluación <strong>DECOFI</strong> y supervise la bolsa anual distribuida <strong>60% RM</strong> y <strong>40% en las 15 regiones</strong>.
            </span>
            <span *ngIf="!authService.esRegionMetropolitana">
              Revise los expedientes comprometidos por Logística de la <strong>{{ authService.nombreRegionActual }}</strong> y emita la <strong>Autorización de Pago</strong> correspondiente.
            </span>
          </p>
        </div>
      </div>

      <!-- MÓDULO 4: DISTRIBUCIÓN PRESUPUESTARIA ANUAL REGIONAL (60% RM / 40% REGIONES) -->
      <div class="card">
        <div class="card-header-flex">
          <div>
            <h2>1. MÓDULO 4: Bolsa Presupuestaria Anual y Regla Automática 60% RM / 40% Regiones</h2>
            <p class="text-muted">
              Bolsa global anual distribuida automáticamente: <strong>60% Región Metropolitana (RM)</strong> y <strong>40% distribuido en las 15 regiones restantes (2,6667% c/u)</strong>, con control de compromisos, devengos y arrastres para evitar sobregiros.
            </p>
          </div>
          <div class="filter-bar">
            <label>Año Ejercicio:</label>
            <select
              class="input-control select-sm"
              [(ngModel)]="anioPresupuesto"
              (change)="cargarPresupuestoAnual()"
            >
              <option [ngValue]="2026">Año 2026</option>
              <option [ngValue]="2027">Año 2027 (Con Arrastres 2026)</option>
            </select>
            <input
              type="number"
              class="input-control select-sm"
              style="width: 145px;"
              [(ngModel)]="montoBolsaConfigurar"
              title="Monto Global Anual CLP"
            />
            <button class="btn btn-sm btn-primary" (click)="recalcularBolsaAnual()">
              Asignar / Recalcular Bolsa 60/40
            </button>
          </div>
        </div>

        <!-- KPIs Presupuesto Global del Año Seleccionado -->
        <div class="kpi-grid" *ngIf="resumenPresupuesto as pres">
          <div class="kpi-card">
            <span class="kpi-label">Bolsa Inicial {{ pres.anio }} (+ Arrastre)</span>
            <strong class="kpi-value">&#36;{{ pres.presupuestoVigenteTotal | number:'1.0-0' }}</strong>
            <small>
              Inicial: &#36;{{ pres.bolsaAnualInicialTotal | number:'1.0-0' }} | Arrastre: &#36;{{ pres.montoArrastreTotal | number:'1.0-0' }}
            </small>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">60% Región Metropolitana (RM)</span>
            <strong class="kpi-value" style="color: var(--primary);">&#36;{{ pres.montoAsignadoRM | number:'1.0-0' }}</strong>
            <small>Asignación directa RM (60,00%)</small>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">40% Otras 15 Regiones del País</span>
            <strong class="kpi-value" style="color: #0369a1;">&#36;{{ pres.montoAsignadoRegiones | number:'1.0-0' }}</strong>
            <small>&#36;{{ (pres.montoAsignadoRegiones / 15) | number:'1.0-0' }} por región (2,6667% c/u)</small>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Comprometido / Pagado / Disponible</span>
            <strong class="kpi-value kpi-success">&#36;{{ pres.totalDisponible | number:'1.0-0' }}</strong>
            <small>
              Comp: &#36;{{ pres.totalComprometido | number:'1.0-0' }} | Pagado: &#36;{{ pres.totalDevengadoPagado | number:'1.0-0' }}
            </small>
          </div>
        </div>

        <div class="btn-group" style="margin-bottom: 0.75rem;">
          <button class="btn btn-sm btn-outline" (click)="mostrarTablaRegiones = !mostrarTablaRegiones">
            {{ mostrarTablaRegiones ? 'Ocultar Desglose de las 16 Regiones' : 'Desplegar Desglose de las 16 Regiones' }}
          </button>
        </div>

        <div class="table-responsive" *ngIf="resumenPresupuesto && mostrarTablaRegiones">
          <table class="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Región Policial PDI</th>
                <th>% Asignación</th>
                <th>Asignado Inicial</th>
                <th>Arrastre Recibido</th>
                <th>Comprometido (Logística)</th>
                <th>Devengado / Pagado</th>
                <th>Saldo Disponible</th>
                <th>% Ejecución</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of resumenPresupuesto.regiones" [class.selected-row]="r.esRegionMetropolitana">
                <td><span class="mono-badge">{{ r.codigoRegion }}</span></td>
                <td>
                  <strong>{{ r.nombreRegion }}</strong>
                  <span *ngIf="r.esRegionMetropolitana" class="side-badge" style="margin-left: 6px;">60% RM</span>
                </td>
                <td><strong>{{ r.porcentajeAsignado | number:'1.2-2' }}%</strong></td>
                <td>&#36;{{ r.montoAsignadoInicial | number:'1.0-0' }}</td>
                <td>&#36;{{ r.montoArrastreAnterior | number:'1.0-0' }}</td>
                <td>&#36;{{ r.montoComprometido | number:'1.0-0' }}</td>
                <td>&#36;{{ r.montoDevengadoPagado | number:'1.0-0' }}</td>
                <td>
                  <strong [style.color]="r.montoDisponible > 0 ? 'var(--success)' : 'var(--danger)'">
                    &#36;{{ r.montoDisponible | number:'1.0-0' }}
                  </strong>
                </td>
                <td>{{ r.porcentajeEjecucion | number:'1.1-1' }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MÓDULO 3 (ETAPA 4): FINANZAS, TESORERÍA Y EVALUACIÓN DECOFI -->
      <div class="card">
        <div class="card-header-flex">
          <div>
            <h2>2. MÓDULO 3 (Etapa 4): Bandeja de Finanzas, Tesorería y Evaluación DECOFI</h2>
            <p class="text-muted">
              Seleccione un expediente con compromiso de Logística para efectuar el <strong>Devengo y Pago Definitivo</strong> en el año vigente, o ejecutar el <strong>Arrastre Presupuestario (ej. 2026 → 2027)</strong> bajo evaluación de <strong>DECOFI</strong>.
            </p>
          </div>
          <button class="btn btn-sm btn-outline" (click)="cargarDatos()">Refrescar</button>
        </div>

        <div class="split-layout">
          <div class="split-main">
            <div *ngIf="pendientesFinanzas.length === 0" class="empty-state">
              <p>No existen expedientes con compromiso de Logística pendientes en Finanzas.</p>
            </div>

            <div class="table-responsive" *ngIf="pendientesFinanzas.length > 0">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Funcionaria / Región</th>
                    <th>Período</th>
                    <th>Días Efectivos</th>
                    <th>Compromiso Logística</th>
                    <th>Monto a Ejecutar</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    *ngFor="let exp of pendientesFinanzas"
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
                      <div><strong>{{ exp.numeroCompromisoPago || 'COMP-LOG' }}</strong></div>
                      <small>{{ exp.logisticaResponsable }}</small>
                    </td>
                    <td>
                      <strong style="color: var(--primary);">
                        &#36;{{ exp.montoProporcionalCalculado | number:'1.0-0' }}
                      </strong>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-primary" (click)="seleccionarParaFinanzas(exp)">
                        Ejecutar Pago / DECOFI
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Panel de Ejecución Financiera / DECOFI -->
          <div class="split-side" *ngIf="expedienteSeleccionado as sel">
            <div class="folder-viewer-card">
              <div class="folder-header">
                <div>
                  <span class="badge-institucional badge-contab-header">FINANZAS Y TESORERÍA #{{ sel.controlID }}</span>
                  <h3>{{ sel.funcionarioNombreCompleto }}</h3>
                  <small>
                    RUT: {{ sel.funcionarioRut }} | Región: <strong>{{ sel.codigoRegion }}</strong> | Monto: <strong>&#36;{{ sel.montoProporcionalCalculado | number:'1.0-0' }}</strong>
                  </small>
                </div>
                <button class="btn-close" (click)="expedienteSeleccionado = null">✕</button>
              </div>

              <div class="form-group">
                <label>Modalidad de Ejecución Financiera (Tesorería / DECOFI) *</label>
                <select class="input-control" [(ngModel)]="formFinanzas.accion">
                  <option value="DEVENGAR_PAGAR">
                    Devengo y Pago Definitivo en Ejercicio Vigente ({{ sel.anio }})
                  </option>
                  <option value="ARRASTRE">
                    Arrastre Presupuestario Interanual ({{ sel.anio }} → {{ sel.anio + 1 }}) con Evaluación DECOFI
                  </option>
                </select>
              </div>

              <div class="form-group" style="margin-top: 0.65rem;">
                <label>Responsable de Finanzas y Tesorería que Autoriza *</label>
                <input
                  type="text"
                  class="input-control"
                  [(ngModel)]="formFinanzas.nombreResponsable"
                  placeholder="Ej: Claudia Alejandra Mendoza Silva"
                />
              </div>

              <div class="form-group" style="margin-top: 0.65rem;">
                <label>Evaluación DECOFI *</label>
                <input
                  type="text"
                  class="input-control"
                  [(ngModel)]="formFinanzas.evaluacionDecofi"
                  placeholder="Ej: DECOFI Conforme — Disponibilidad y arrastre validado"
                />
              </div>

              <div class="form-group" style="margin-top: 0.65rem;" *ngIf="formFinanzas.accion === 'ARRASTRE'">
                <label>Año Presupuestario de Destino del Arrastre *</label>
                <input
                  type="number"
                  class="input-control"
                  [(ngModel)]="formFinanzas.anioArrastreDestino"
                />
              </div>

              <div class="formal-doc-preview" style="margin-top: 1rem;">
                <span class="preview-tag">DOCUMENTO FORMAL DE TESORERÍA A EMITIR:</span>
                <blockquote class="formal-quote">
                  "{{ generarVistaPreviaTextoFormal(sel) }}"
                </blockquote>
              </div>

              <div class="resolution-actions">
                <button
                  class="btn btn-success"
                  (click)="ejecutarAccionFinanzas(sel)"
                >
                  {{ formFinanzas.accion === 'ARRASTRE' ? '✓ Ejecutar Arrastre Presupuestario DECOFI (' + sel.anio + ' → ' + formFinanzas.anioArrastreDestino + ')' : '✓ Ejecutar Devengo y Pago Definitivo en Tesorería' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- HISTORIAL DE PAGOS Y ARRASTRES EJECUTADOS EN FINANZAS -->
      <div class="card">
        <h2>3. Historial de Devengos Pagados y Arrastres Presupuestarios (DECOFI)</h2>
        <div *ngIf="ejecutadosFinanzas.length === 0" class="empty-state">
          <p>Aún no existen expedientes pagados o arrastrados en Finanzas.</p>
        </div>

        <div class="table-responsive" *ngIf="ejecutadosFinanzas.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Funcionaria / Región</th>
                <th>Período Origen</th>
                <th>Modalidad / Año Imputación</th>
                <th>Evaluación DECOFI</th>
                <th>Monto Ejecutado</th>
                <th>Comprobante / Autorización</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of ejecutadosFinanzas">
                <td><strong>#{{ p.controlID }}</strong></td>
                <td>
                  <div><strong>{{ p.funcionarioNombreCompleto }}</strong></div>
                  <small class="mono-badge">{{ p.funcionarioRut }}</small>
                  <small class="side-badge" style="margin-left: 4px;">{{ p.codigoRegion }}</small>
                </td>
                <td>{{ obtenerNombreMes(p.mes) }} {{ p.anio }}</td>
                <td>
                  <span class="badge-estado" [ngClass]="p.estadoFlujo === 'Arrastre Presupuestario' ? 'badge-pendiente' : 'badge-aprobada'">
                    {{ p.estadoFlujo }} (Imputado {{ p.anioImputacionPresupuestaria || p.anio }})
                  </span>
                </td>
                <td><small>{{ p.evaluacionDecofi || 'Conforme DECOFI' }}</small></td>
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
export class VistaContabilidadComponent implements OnInit {
  private readonly controlMensualService = inject(ControlMensualService);
  private readonly usuarioSistemaService = inject(UsuarioSistemaService);
  private readonly notificacionService = inject(NotificacionService);
  readonly authService = inject(AuthService);

  readonly meses = MESES_CATALOGO;
  readonly regionesChile = REGIONES_CHILE;

  anioPresupuesto = 2026;
  montoBolsaConfigurar = 60000000;
  resumenPresupuesto: ResumenPresupuestoAnualDto | null = null;
  mostrarTablaRegiones = true;
  filtroRegion = '';

  pendientesFinanzas: ControlMensualDto[] = [];
  ejecutadosFinanzas: ControlMensualDto[] = [];
  expedienteSeleccionado: ControlMensualDto | null = null;

  formFinanzas = {
    accion: 'DEVENGAR_PAGAR' as 'DEVENGAR_PAGAR' | 'ARRASTRE',
    nombreResponsable: 'Claudia Alejandra Mendoza Silva',
    evaluacionDecofi: 'Evaluado DECOFI Conforme — Imputación presupuestaria autorizada',
    anioArrastreDestino: 2027
  };

  ngOnInit(): void {
    if (this.authService.usuarioActual) {
      this.formFinanzas.nombreResponsable = this.authService.usuarioActual.nombreCompleto;
      if (!this.authService.esRegionMetropolitana) {
        this.formFinanzas.evaluacionDecofi = `Autorización de Pago Conforme (${this.authService.nombreRegionActual})`;
      }
      this.notificacionService.establecerUsuarioResponsable(
        `${this.authService.usuarioActual.nombreCompleto} (${this.authService.esRegionMetropolitana ? 'Finanzas / DECOFI' : 'Autorización de Pago - ' + this.authService.codigoRegionActual})`
      );
    }

    this.usuarioSistemaService.listar().subscribe({
      next: (lista) => {
        const fin = lista.find(u => u.rol === 'Finanzas');
        if (!this.authService.usuarioActual && fin) {
          this.formFinanzas.nombreResponsable = fin.nombreCompleto;
        }
      }
    });
    this.cargarPresupuestoAnual();
    this.cargarDatos();
  }

  cargarPresupuestoAnual(): void {
    this.controlMensualService.obtenerPresupuestoAnualRegional(this.anioPresupuesto).subscribe({
      next: (res) => {
        this.resumenPresupuesto = res;
        if (res.bolsaAnualInicialTotal > 0) {
          this.montoBolsaConfigurar = res.bolsaAnualInicialTotal;
        }
      }
    });
  }

  recalcularBolsaAnual(): void {
    this.controlMensualService
      .inicializarPresupuestoAnualRegional({
        anio: this.anioPresupuesto,
        montoTotalAnual: this.montoBolsaConfigurar,
        usuarioResponsable: this.notificacionService.usuarioActual
      })
      .subscribe({
        next: (res) => {
          this.resumenPresupuesto = res;
          this.notificacionService.exito(
            `Presupuesto anual ${res.anio} actualizado: 60% RM ($${res.montoAsignadoRM.toLocaleString('es-CL')}) y 40% en las 15 regiones restantes ($${res.montoAsignadoRegiones.toLocaleString('es-CL')}).`
          );
        }
      });
  }

  cargarDatos(): void {
    const regFiltro = this.authService.esRegionMetropolitana
      ? (this.filtroRegion || undefined)
      : this.authService.codigoRegionActual;

    this.controlMensualService.listarControles({ codigoRegion: regFiltro }).subscribe({
      next: (todos) => {
        this.pendientesFinanzas = todos.filter(c => c.estadoFlujo === 'Compromiso Logistica');
        this.ejecutadosFinanzas = todos.filter(
          c =>
            c.estadoFlujo === 'Devengado Finanzas' ||
            c.estadoFlujo === 'Arrastre Presupuestario' ||
            c.estadoFlujo === 'Pagado Tesoreria' ||
            c.estadoFlujo === 'Pagado Finanzas'
        );
      }
    });
  }

  seleccionarParaFinanzas(exp: ControlMensualDto): void {
    this.expedienteSeleccionado = exp;
    this.formFinanzas.anioArrastreDestino = exp.anio + 1;
  }

  generarVistaPreviaTextoFormal(exp: ControlMensualDto): string {
    const nombrePersona = exp.funcionarioNombreCompleto || 'Nombre Funcionaria';
    const rutPersona = exp.funcionarioRut || 'RUT';
    const montoStr = '$' + Math.round(exp.montoProporcionalCalculado).toLocaleString('es-CL');
    const sufijo =
      this.formFinanzas.accion === 'ARRASTRE'
        ? ` (Imputación Arrastre Presupuestario DECOFI ${exp.anio} -> ${this.formFinanzas.anioArrastreDestino})`
        : '';
    return `Se autoriza pago a ${nombrePersona} RUT ${rutPersona} por un monto de ${montoStr}${sufijo}. Atentamente ${this.formFinanzas.nombreResponsable}`;
  }

  ejecutarAccionFinanzas(exp: ControlMensualDto): void {
    if (!this.formFinanzas.nombreResponsable.trim()) {
      this.notificacionService.alerta('Ingrese el nombre del responsable de Finanzas y Tesorería.');
      return;
    }

    this.controlMensualService
      .avanzarEtapaCircuito(exp.controlID, {
        rolAccion: 'FINANZAS',
        accion: this.formFinanzas.accion,
        nombreResponsable: this.formFinanzas.nombreResponsable.trim(),
        evaluacionDecofi: this.formFinanzas.evaluacionDecofi.trim(),
        anioArrastreDestino:
          this.formFinanzas.accion === 'ARRASTRE' ? this.formFinanzas.anioArrastreDestino : exp.anio,
        observaciones: this.formFinanzas.evaluacionDecofi.trim()
      })
      .subscribe({
        next: (actualizado) => {
          this.notificacionService.exito(
            this.formFinanzas.accion === 'ARRASTRE'
              ? `Arrastre presupuestario ejecutado (${exp.anio} → ${actualizado.anioImputacionPresupuestaria}) bajo evaluación DECOFI.`
              : `Devengo y pago definitivo ejecutado exitosamente en Tesorería.`
          );
          this.expedienteSeleccionado = null;
          this.cargarPresupuestoAnual();
          this.cargarDatos();
        }
      });
  }

  obtenerNombreMes(mes: number): string {
    return this.meses.find(m => m.numero === mes)?.nombre || `Mes ${mes}`;
  }
}
