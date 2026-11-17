import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AuditoriaSistemaDto,
  CrearActualizarUsuarioSistemaRequest,
  HistorialAlertaDto,
  InicializarPresupuestoAnualRequest,
  MESES_CATALOGO,
  REGIONES_CHILE,
  ResumenPresupuestoAnualDto,
  RolSistema,
  UsuarioSistemaDto
} from '../../core/models/sala-cuna.models';
import { UsuarioSistemaService } from '../../core/services/usuario-sistema.service';
import { ControlMensualService } from '../../core/services/control-mensual.service';
import { NotificacionService } from '../../core/services/notificacion.service';

@Component({
  selector: 'app-vista-administrador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="section-header">
        <div>
          <span class="badge-institucional">ADMINISTRADOR DEL SISTEMA (RUT OFICIAL: 18441463-5)</span>
          <h1>Administración de RUTs, Contraseñas y Roles del Sistema</h1>
          <p class="subtitle">
            Agregue o actualice los RUTs habilitados para ingresar al sistema en los perfiles: <strong>Postulante</strong>, <strong>Coordinador</strong>, <strong>Visador</strong>, <strong>Logística</strong>, <strong>Finanzas</strong>, <strong>Tesorería</strong> y <strong>Administrador</strong>.
          </p>
        </div>
      </div>

      <!-- Pestañas -->
      <div class="tabs-bar">
        <button
          class="tab-btn"
          [class.active]="tabActiva === 'usuarios'"
          (click)="cambiarTab('usuarios')"
        >
          1. Gestión de RUTs y Roles ({{ usuarios.length }})
        </button>
        <button
          class="tab-btn"
          [class.active]="tabActiva === 'presupuesto'"
          (click)="cambiarTab('presupuesto')"
        >
          2. Bolsa Presupuestaria Anual y Regiones
        </button>
        <button
          class="tab-btn"
          [class.active]="tabActiva === 'alertas'"
          (click)="cambiarTab('alertas')"
        >
          3. Historial de Alertas ({{ alertas.length }})
        </button>
        <button
          class="tab-btn"
          [class.active]="tabActiva === 'auditoria'"
          (click)="cambiarTab('auditoria')"
        >
          4. Bitácora de Auditoría ({{ registrosAuditoria.length }})
        </button>
      </div>

      <!-- TAB 1: USUARIOS DEL SISTEMA -->
      <div class="card" *ngIf="tabActiva === 'usuarios'">
        <div class="card-header-flex">
          <h2>Alta y Administración de Usuarios por RUT y Rol</h2>
          <button class="btn btn-primary btn-sm" (click)="mostrarFormUsuario = !mostrarFormUsuario">
            {{ mostrarFormUsuario ? 'Ocultar Formulario' : '+ Agregar / Actualizar RUT y Rol' }}
          </button>
        </div>

        <div class="sync-panel" *ngIf="mostrarFormUsuario">
          <h3>Registrar o Actualizar Usuario por RUT (Administrador 18441463-5)</h3>
          <div class="grid-form">
            <div class="form-group">
              <label>RUT *</label>
              <input type="text" class="input-control" [(ngModel)]="formUsuario.rut" placeholder="Ej: 16543210-9" />
            </div>
            <div class="form-group">
              <label>Nombres *</label>
              <input type="text" class="input-control" [(ngModel)]="formUsuario.nombres" placeholder="Nombres" />
            </div>
            <div class="form-group">
              <label>Apellidos *</label>
              <input type="text" class="input-control" [(ngModel)]="formUsuario.apellidos" placeholder="Apellidos" />
            </div>
            <div class="form-group">
              <label>Rol / Vista Asignada *</label>
              <select class="input-control" [(ngModel)]="formUsuario.rol">
                <option value="Postulante">Postulante (Vista Funcionaria / Beneficiaria)</option>
                <option value="Coordinador">Coordinador (Vista Coordinación)</option>
                <option value="Visador">Visador (Vista Visación)</option>
                <option value="Logistica">Logistica (Vista Logística)</option>
                <option value="Finanzas">Finanzas (Vista DECOFI / Presupuesto 60-40)</option>
                <option value="Tesoreria">Tesoreria (Vista Pago Final Tesorería)</option>
                <option value="Administrador">Administrador (Gestión de RUTs y Auditoría)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Contraseña de Acceso *</label>
              <input
                type="text"
                class="input-control"
                [(ngModel)]="formUsuario.password"
                placeholder="Por defecto: 123456"
              />
            </div>
            <div class="form-group">
              <label>Correo Electrónico *</label>
              <input type="email" class="input-control" [(ngModel)]="formUsuario.correoElectronico" placeholder="usuario@investigaciones.cl" />
            </div>
            <div class="form-group">
              <label>Región Institucional PDI *</label>
              <select class="input-control" [(ngModel)]="formUsuario.codigoRegion" (change)="alCambiarRegionUsuario()">
                <option *ngFor="let r of regionesChile" [value]="r.codigo">{{ r.nombre }}</option>
              </select>
              <small class="text-muted" style="font-size: 0.78rem; display: block; margin-top: 0.25rem;">
                Si es <strong>RM</strong>, supervisa todo el país y aplica DECOFI. Si es de <strong>Región</strong>, solo ve sus expedientes y aplica Autorización de Pago.
              </small>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" (click)="guardarUsuario()">
              Guardar RUT y Habilitar Acceso
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>RUT</th>
                <th>Nombre Completo</th>
                <th>Rol / Vista Asignada</th>
                <th>Región Institucional</th>
                <th>Correo Electrónico</th>
                <th>Fecha Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of usuarios">
                <td>#{{ u.usuarioID }}</td>
                <td><span class="mono-badge">{{ u.rut }}</span></td>
                <td><strong>{{ u.nombreCompleto }}</strong></td>
                <td>
                  <span class="badge-estado badge-aprobada">{{ u.rol }}</span>
                </td>
                <td>
                  <span class="mono-badge" [style.background]="u.codigoRegion === 'RM' ? '#e0f2fe' : '#fef3c7'" [style.color]="u.codigoRegion === 'RM' ? '#0369a1' : '#b45309'">
                    {{ u.codigoRegion }}
                  </span>
                  <span style="font-size: 0.82rem; margin-left: 0.35rem;">{{ u.nombreRegion }}</span>
                </td>
                <td>{{ u.correoElectronico }}</td>
                <td>{{ u.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}</td>
                <td>
                  <button class="btn btn-sm btn-outline" (click)="editarUsuario(u)">
                    Editar Rol / Clave
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 2: BOLSA PRESUPUESTARIA ANUAL Y DISTRIBUCIÓN REGIONAL -->
      <div class="card" *ngIf="tabActiva === 'presupuesto'">
        <div class="card-header-flex">
          <div>
            <h2>Configuración de la Bolsa Presupuestaria Anual y Distribución Regional</h2>
            <p class="text-muted">
              Configure la <strong>Resolución Oficial</strong>, el <strong>Monto Total de la Bolsa Global</strong> y la <strong>Asignación para las Regiones</strong> (40% regiones restantes y 60% Región Metropolitana).
            </p>
          </div>
          <button class="btn btn-outline btn-sm" (click)="cargarPresupuesto()">Refrescar Presupuesto</button>
        </div>

        <div class="sync-panel" style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem;">
          <h3 style="margin-top: 0;">Fijar Bolsa Presupuestaria Anual (Administrador)</h3>
          <div class="grid-form">
            <div class="form-group">
              <label>Año del Ejercicio *</label>
              <select class="input-control" [(ngModel)]="formPresupuesto.anio" (change)="cargarPresupuesto()">
                <option [ngValue]="2026">Año 2026</option>
                <option [ngValue]="2027">Año 2027</option>
                <option [ngValue]="2028">Año 2028</option>
              </select>
            </div>
            <div class="form-group">
              <label>Número de Resolución de Asignación *</label>
              <input
                type="text"
                class="input-control"
                [(ngModel)]="formPresupuesto.numeroResolucion"
                placeholder="Ej: RES-DIPRES-2026-0045"
              />
            </div>
            <div class="form-group">
              <label>Monto Total de la Bolsa Anual (CLP &#36;) *</label>
              <input
                type="number"
                min="1000000"
                step="1000000"
                class="input-control"
                [(ngModel)]="formPresupuesto.montoTotalAnual"
                (ngModelChange)="alCambiarMontoTotalBolsa($event)"
              />
            </div>
            <div class="form-group">
              <label>Monto Designado a las Regiones (CLP &#36;) *</label>
              <input
                type="number"
                min="0"
                step="500000"
                class="input-control"
                [(ngModel)]="formPresupuesto.montoDesignadoRegiones"
                (ngModelChange)="alCambiarMontoRegiones($event)"
              />
            </div>
          </div>

          <!-- Indicador visual en tiempo real de la distribución 60/40 -->
          <div class="novedad-alert sin-novedad" style="margin-top: 1rem;">
            <strong>Desglose de la Distribución Presupuestaria Calculada:</strong>
            <div style="margin-top: 0.35rem; display: flex; gap: 1.5rem; flex-wrap: wrap;">
              <span>Bolsa Global Total: <strong>&#36;{{ formPresupuesto.montoTotalAnual | number:'1.0-0' }}</strong> (100%)</span>
              <span>Región Metropolitana (RM): <strong>&#36;{{ calcularMontoRMPreview() | number:'1.0-0' }}</strong> ({{ calcularPorcentajeRMPreview() | number:'1.2-2' }}%)</span>
              <span>Regiones Restantes (15): <strong>&#36;{{ formPresupuesto.montoDesignadoRegiones | number:'1.0-0' }}</strong> ({{ calcularPorcentajeRegionesPreview() | number:'1.2-2' }}%)</span>
              <span>Asignación Individual por Región: <strong>&#36;{{ calcularMontoIndividualRegionPreview() | number:'1.0-0' }}</strong> c/u ({{ (calcularPorcentajeRegionesPreview() / 15) | number:'1.4-4' }}% c/u)</span>
            </div>
          </div>

          <div class="form-actions" style="margin-top: 1.25rem;">
            <button class="btn btn-primary" [disabled]="guardandoPresupuesto" (click)="guardarBolsaPresupuestaria()">
              {{ guardandoPresupuesto ? 'Guardando y Distribuyendo...' : '✓ Guardar y Distribuir Bolsa Presupuestaria Anual' }}
            </button>
          </div>
        </div>

        <div *ngIf="resumenPresupuesto as p">
          <!-- Tarjetas Resumen KPIs -->
          <div class="kpi-grid" style="margin-bottom: 1.5rem;">
            <div class="kpi-card">
              <span class="kpi-label">Bolsa Global Anual (Año {{ p.anio }})</span>
              <strong class="kpi-value">&#36;{{ p.bolsaAnualInicialTotal | number:'1.0-0' }}</strong>
              <small>Resolución: {{ p.numeroResolucion || formPresupuesto.numeroResolucion || 'Vigente' }}</small>
            </div>
            <div class="kpi-card">
              <span class="kpi-label">Asignado Región Metropolitana (60%)</span>
              <strong class="kpi-value kpi-success">&#36;{{ p.montoAsignadoRM | number:'1.0-0' }}</strong>
              <small>60% de la bolsa inicial</small>
            </div>
            <div class="kpi-card">
              <span class="kpi-label">Asignado 15 Regiones Restantes (40%)</span>
              <strong class="kpi-value kpi-warn">&#36;{{ p.montoAsignadoRegiones | number:'1.0-0' }}</strong>
              <small>&#36;{{ (p.montoAsignadoRegiones / 15) | number:'1.0-0' }} por región</small>
            </div>
            <div class="kpi-card">
              <span class="kpi-label">Total Disponible Actual</span>
              <strong class="kpi-value" [style.color]="p.totalDisponible >= 0 ? 'var(--success)' : 'var(--danger)'">
                &#36;{{ p.totalDisponible | number:'1.0-0' }}
              </strong>
              <small>Comprometido: &#36;{{ p.totalComprometido | number:'1.0-0' }}</small>
            </div>
          </div>

          <!-- Tabla de Regiones -->
          <h3>Distribución Regional Detallada (16 Regiones PDI)</h3>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Región</th>
                  <th>Tipo</th>
                  <th>% Asignado</th>
                  <th>Monto Inicial</th>
                  <th>Arrastre Anterior</th>
                  <th>Presupuesto Vigente</th>
                  <th>Comprometido</th>
                  <th>Devengado / Pagado</th>
                  <th>Disponible</th>
                  <th>% Ejecución</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let reg of p.regiones" [style.background]="reg.esRegionMetropolitana ? '#f0fdf4' : ''">
                  <td>
                    <strong>{{ reg.nombreRegion }}</strong>
                    <div><small class="mono-badge">{{ reg.codigoRegion }}</small></div>
                  </td>
                  <td>
                    <span class="side-badge">{{ reg.esRegionMetropolitana ? 'Metropolitana (60%)' : 'Regional (40%)' }}</span>
                  </td>
                  <td><strong>{{ reg.porcentajeAsignado | number:'1.2-4' }}%</strong></td>
                  <td><strong>&#36;{{ reg.montoAsignadoInicial | number:'1.0-0' }}</strong></td>
                  <td>&#36;{{ reg.montoArrastreAnterior | number:'1.0-0' }}</td>
                  <td><strong>&#36;{{ reg.montoPresupuestoVigente | number:'1.0-0' }}</strong></td>
                  <td>&#36;{{ reg.montoComprometido | number:'1.0-0' }}</td>
                  <td>&#36;{{ reg.montoDevengadoPagado | number:'1.0-0' }}</td>
                  <td>
                    <strong [style.color]="reg.montoDisponible >= 0 ? 'var(--success)' : 'var(--danger)'">
                      &#36;{{ reg.montoDisponible | number:'1.0-0' }}
                    </strong>
                  </td>
                  <td>
                    <span class="badge-estado" [ngClass]="reg.porcentajeEjecucion >= 90 ? 'badge-rechazada' : reg.porcentajeEjecucion > 0 ? 'badge-pendiente' : 'badge-aprobada'">
                      {{ reg.porcentajeEjecucion | number:'1.1-2' }}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 3: ALERTAS -->
      <div class="card" *ngIf="tabActiva === 'alertas'">
        <div class="card-header-flex">
          <h2>Historial de Alertas del Flujo Operativo</h2>
          <div class="btn-group">
            <button class="btn btn-accent btn-sm" (click)="generarAlertasPendientes()">
              ⚡ Verificar Expedientes Retenidos / Devueltos
            </button>
            <button class="btn btn-outline btn-sm" (click)="cargarAlertas()">Refrescar</button>
          </div>
        </div>

        <div *ngIf="alertas.length === 0" class="empty-state">
          <p>No existen alertas registradas.</p>
        </div>

        <div class="table-responsive" *ngIf="alertas.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Funcionaria</th>
                <th>Período</th>
                <th>Mensaje</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let al of alertas">
                <td>#{{ al.alertaID }}</td>
                <td>{{ al.fechaAlerta | date:'dd/MM/yyyy HH:mm' }}</td>
                <td>
                  <strong>{{ al.funcionarioNombreCompleto || 'Postulación' }}</strong>
                  <div><small class="mono-badge">{{ al.funcionarioRut }}</small></div>
                </td>
                <td>{{ al.mes ? obtenerNombreMes(al.mes) + ' ' + al.anio : '—' }}</td>
                <td>{{ al.mensaje }}</td>
                <td>
                  <span class="badge-estado" [ngClass]="al.estadoAlerta === 'Enviada' ? 'badge-rechazada' : 'badge-aprobada'">
                    {{ al.estadoAlerta }}
                  </span>
                </td>
                <td>
                  <button
                    *ngIf="al.estadoAlerta === 'Enviada'"
                    class="btn btn-sm btn-primary"
                    (click)="revisarAlerta(al)"
                  >
                    Marcar Revisada
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 3: AUDITORÍA -->
      <div class="card" *ngIf="tabActiva === 'auditoria'">
        <div class="card-header-flex">
          <h2>Bitácora de Auditoría del Sistema (AuditoriaSistema)</h2>
          <button class="btn btn-outline btn-sm" (click)="cargarAuditoria()">Refrescar Bitácora</button>
        </div>

        <div class="table-responsive" *ngIf="registrosAuditoria.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha / Hora</th>
                <th>Usuario Responsable</th>
                <th>Acción</th>
                <th>Tabla</th>
                <th>Registro ID</th>
                <th>Detalle del Cambio</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let a of registrosAuditoria">
                <td>#{{ a.auditoriaID }}</td>
                <td>{{ a.fechaHora | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                <td><span class="mono-badge">{{ a.usuarioResponsable }}</span></td>
                <td><strong>{{ a.accion }}</strong></td>
                <td>{{ a.tablaAfectada }}</td>
                <td>#{{ a.registroID }}</td>
                <td>{{ a.detalleCambio }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class VistaAdministradorComponent implements OnInit {
  private readonly usuarioService = inject(UsuarioSistemaService);
  private readonly controlService = inject(ControlMensualService);
  private readonly notificacionService = inject(NotificacionService);

  readonly meses = MESES_CATALOGO;
  readonly regionesChile = REGIONES_CHILE;

  tabActiva: 'usuarios' | 'presupuesto' | 'alertas' | 'auditoria' = 'usuarios';
  usuarios: UsuarioSistemaDto[] = [];
  alertas: HistorialAlertaDto[] = [];
  registrosAuditoria: AuditoriaSistemaDto[] = [];
  resumenPresupuesto: ResumenPresupuestoAnualDto | null = null;
  guardandoPresupuesto = false;

  formPresupuesto: InicializarPresupuestoAnualRequest = {
    anio: 2026,
    numeroResolucion: 'RES-DIPRES-2026-0045',
    montoTotalAnual: 60000000,
    montoDesignadoRegiones: 24000000
  };

  mostrarFormUsuario = true;
  formUsuario: CrearActualizarUsuarioSistemaRequest = {
    rut: '',
    nombres: '',
    apellidos: '',
    rol: 'Postulante',
    correoElectronico: '',
    password: '123456',
    codigoRegion: 'RM'
  };

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarPresupuesto();
    this.cargarAlertas();
    this.cargarAuditoria();
  }

  cambiarTab(tab: 'usuarios' | 'presupuesto' | 'alertas' | 'auditoria'): void {
    this.tabActiva = tab;
    if (tab === 'usuarios') this.cargarUsuarios();
    if (tab === 'presupuesto') this.cargarPresupuesto();
    if (tab === 'alertas') this.cargarAlertas();
    if (tab === 'auditoria') this.cargarAuditoria();
  }

  cargarPresupuesto(): void {
    this.controlService.obtenerPresupuestoAnualRegional(this.formPresupuesto.anio).subscribe({
      next: (res) => {
        this.resumenPresupuesto = res;
        if (res.numeroResolucion) {
          this.formPresupuesto.numeroResolucion = res.numeroResolucion;
        }
        if (res.bolsaAnualInicialTotal > 0) {
          this.formPresupuesto.montoTotalAnual = res.bolsaAnualInicialTotal;
        }
        if (res.montoAsignadoRegiones > 0) {
          this.formPresupuesto.montoDesignadoRegiones = res.montoAsignadoRegiones;
        }
      }
    });
  }

  alCambiarMontoTotalBolsa(total: number): void {
    const t = total || 0;
    // Si cambia el total, sugerir por defecto el 40% a regiones
    this.formPresupuesto.montoDesignadoRegiones = Math.round(t * 0.40);
  }

  alCambiarMontoRegiones(montoReg: number): void {
    // Validación opcional si excede el total
  }

  calcularMontoRMPreview(): number {
    const total = this.formPresupuesto.montoTotalAnual || 0;
    const regiones = this.formPresupuesto.montoDesignadoRegiones || 0;
    return Math.max(0, total - regiones);
  }

  calcularPorcentajeRMPreview(): number {
    const total = this.formPresupuesto.montoTotalAnual || 0;
    if (total <= 0) return 0;
    return (this.calcularMontoRMPreview() / total) * 100;
  }

  calcularPorcentajeRegionesPreview(): number {
    const total = this.formPresupuesto.montoTotalAnual || 0;
    if (total <= 0) return 0;
    const regiones = this.formPresupuesto.montoDesignadoRegiones || 0;
    return (regiones / total) * 100;
  }

  calcularMontoIndividualRegionPreview(): number {
    const regiones = this.formPresupuesto.montoDesignadoRegiones || 0;
    return Math.round(regiones / 15);
  }

  guardarBolsaPresupuestaria(): void {
    if (this.guardandoPresupuesto) return;

    if (!this.formPresupuesto.numeroResolucion?.trim()) {
      this.notificacionService.alerta('Debe indicar el Número de Resolución oficial de la asignación presupuestaria.');
      return;
    }

    if (!this.formPresupuesto.montoTotalAnual || this.formPresupuesto.montoTotalAnual < 1000000) {
      this.notificacionService.alerta('El monto total anual de la bolsa debe ser de al menos $1.000.000.');
      return;
    }

    const montoReg = this.formPresupuesto.montoDesignadoRegiones || 0;
    if (montoReg > this.formPresupuesto.montoTotalAnual) {
      this.notificacionService.alerta('El monto designado a las regiones no puede ser superior a la bolsa total anual.');
      return;
    }

    this.guardandoPresupuesto = true;

    this.controlService
      .inicializarPresupuestoAnualRegional({
        anio: this.formPresupuesto.anio,
        numeroResolucion: this.formPresupuesto.numeroResolucion.trim(),
        montoTotalAnual: this.formPresupuesto.montoTotalAnual,
        montoDesignadoRegiones: montoReg,
        usuarioResponsable: this.notificacionService.usuarioActual
      })
      .subscribe({
        next: (actualizado) => {
          this.guardandoPresupuesto = false;
          this.resumenPresupuesto = actualizado;
          this.notificacionService.exito(
            `Bolsa Anual Año ${this.formPresupuesto.anio} guardada exitosamente bajo Resolución N° ${this.formPresupuesto.numeroResolucion}. Distribuido: $${actualizado.montoAsignadoRM.toLocaleString('es-CL')} RM / $${actualizado.montoAsignadoRegiones.toLocaleString('es-CL')} Regiones.`
          );
        },
        error: () => {
          this.guardandoPresupuesto = false;
        }
      });
  }

  cargarUsuarios(): void {
    this.usuarioService.listar().subscribe({
      next: (lista) => (this.usuarios = lista)
    });
  }

  editarUsuario(u: UsuarioSistemaDto): void {
    this.formUsuario = {
      rut: u.rut,
      nombres: u.nombres,
      apellidos: u.apellidos,
      rol: u.rol as RolSistema,
      correoElectronico: u.correoElectronico,
      password: '123456',
      codigoRegion: u.codigoRegion || 'RM',
      nombreRegion: u.nombreRegion || 'Región Metropolitana de Santiago'
    };
    this.mostrarFormUsuario = true;
  }

  alCambiarRegionUsuario(): void {
    const reg = this.regionesChile.find(r => r.codigo === this.formUsuario.codigoRegion);
    if (reg) {
      this.formUsuario.nombreRegion = reg.nombre;
    }
  }

  guardarUsuario(): void {
    if (!this.formUsuario.rut?.trim()) {
      this.notificacionService.alerta('Debe ingresar el RUT del usuario.');
      return;
    }
    if (!this.formUsuario.nombres?.trim()) {
      this.notificacionService.alerta('Debe ingresar los nombres del usuario.');
      return;
    }
    if (!this.formUsuario.apellidos?.trim()) {
      this.formUsuario.apellidos = 'PDI';
    }
    if (!this.formUsuario.correoElectronico?.trim()) {
      const rutLimpio = this.formUsuario.rut.replace(/[^0-9kK]/g, '').toLowerCase();
      this.formUsuario.correoElectronico = `${rutLimpio}@investigaciones.cl`;
    }

    this.usuarioService.guardar(this.formUsuario).subscribe({
      next: (guardado) => {
        this.notificacionService.exito(
          `RUT ${guardado.rut} (${guardado.nombreCompleto}) registrado con rol '${guardado.rol}'.`
        );
        this.formUsuario = {
          rut: '',
          nombres: '',
          apellidos: '',
          rol: 'Postulante',
          correoElectronico: '',
          password: '123456',
          codigoRegion: 'RM'
        };
        this.cargarUsuarios();
      },
      error: (err) => {
        let detalle = 'Ocurrió un error al guardar el usuario en el sistema.';
        if (err.error?.errors) {
          const listado = Object.values(err.error.errors).flat();
          detalle = `Datos inválidos: ${listado.join(' ')}`;
        } else if (err.error?.mensaje) {
          detalle = err.error.mensaje;
        } else if (err.message) {
          detalle = err.message;
        }
        this.notificacionService.alerta(detalle);
      }
    });
  }

  cargarAlertas(): void {
    this.controlService.listarAlertas().subscribe({
      next: (lista) => (this.alertas = lista)
    });
  }

  generarAlertasPendientes(): void {
    this.controlService.generarAlertasPendientes().subscribe({
      next: (lista) => {
        this.alertas = lista;
        this.notificacionService.exito('Verificación de alertas completada.');
      }
    });
  }

  revisarAlerta(al: HistorialAlertaDto): void {
    this.controlService
      .marcarAlertaRevisada(al.alertaID, {
        usuarioResponsable: this.notificacionService.usuarioActual,
        detalleRevision: 'Revisada en panel de administración'
      })
      .subscribe({
        next: () => {
          this.notificacionService.exito(`Alerta #${al.alertaID} marcada como Revisada.`);
          this.cargarAlertas();
        }
      });
  }

  cargarAuditoria(): void {
    this.controlService.listarAuditoria().subscribe({
      next: (lista) => (this.registrosAuditoria = lista)
    });
  }

  obtenerNombreMes(mes: number): string {
    return this.meses.find(m => m.numero === mes)?.nombre || `Mes ${mes}`;
  }
}
