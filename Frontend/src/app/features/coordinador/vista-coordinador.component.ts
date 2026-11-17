import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  ControlMensualDto,
  DocumentoInicialDto,
  EvaluacionDocumentoItemDto,
  MESES_CATALOGO,
  REGIONES_CHILE,
  SolicitudDto
} from '../../core/models/sala-cuna.models';
import { AuthService } from '../../core/services/auth.service';
import { SolicitudService } from '../../core/services/solicitud.service';
import { DocumentoService } from '../../core/services/documento.service';
import { ControlMensualService } from '../../core/services/control-mensual.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { SimuladorFechaService } from '../../core/services/simulador-fecha.service';

interface EvaluacionDocFormulario {
  documentoID: number;
  tipoDocumento: string;
  nombreArchivo: string;
  fechaSubida?: string | null;
  aprobado: boolean;
  observacion: string;
}

@Component({
  selector: 'app-vista-coordinador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Encabezado Exclusivo del Rol Coordinador -->
      <div class="section-header">
        <div>
          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <span class="badge-institucional">ROL 1: COORDINADOR SALA CUNA PDI</span>
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
          <h1>Gestión de Postulantes y Lista de Pago Activa</h1>
          <p class="subtitle">
            Seleccione entre la vista de <strong>Postulantes</strong> (para visualizar los 4 documentos oficiales cargados por la postulante, aprobar o rechazar con observaciones cada documento y asociar el <strong>Número de Resolución</strong>) y la vista de <strong>Lista de Pago</strong>.
          </p>
        </div>
        <div class="filter-bar" *ngIf="authService.esRegionMetropolitana" style="align-self: flex-start;">
          <label style="font-weight: 600; font-size: 0.82rem;">Filtrar Región:</label>
          <select class="input-control select-sm" [(ngModel)]="filtroRegion" (change)="cargarDatosCoordinador()">
            <option value="">Todas las Regiones (Nacional)</option>
            <option *ngFor="let r of regionesChile" [value]="r.codigo">{{ r.nombre }}</option>
          </select>
        </div>
      </div>

      <!-- BARRA DE EMULADOR DE FECHA Y CORTE DÍA 30 PARA EL COORDINADOR -->
      <div class="card" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; border: 1px solid #334155; margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
              <span class="badge-institucional" style="background: #3b82f6; color: #ffffff; font-weight: 700;">
                🗓️ CALENDARIO EMULADOR — DÍA 30 DE CADA MES
              </span>
              <span
                class="badge-institucional"
                [style.background]="simuladorFecha.esDia30 ? '#10b981' : '#f59e0b'"
                style="color: #ffffff; font-weight: 700;"
              >
                {{ simuladorFecha.esDia30 ? '✔ CORTE DÍA 30 ACTIVO' : 'ℹ DÍA INTERMEDIO (NO CORTE)' }}
              </span>
            </div>
            <div style="margin-top: 0.4rem; font-size: 1.15rem; font-weight: 600;">
              Fecha Simulada del Sistema:
              <span style="color: #38bdf8; text-decoration: underline;">
                {{ simuladorFecha.fechaActual | date:'dd \\'de\\' MMMM \\'de\\' yyyy' }}
              </span>
              <span style="font-size: 0.85rem; color: #94a3b8; margin-left: 0.5rem;">
                (Período: {{ obtenerNombreMes(simuladorFecha.mes) }} {{ simuladorFecha.anio }})
              </span>
            </div>
            <p style="margin: 0.25rem 0 0 0; font-size: 0.82rem; color: #cbd5e1;">
              Navegue entre meses simulando el corte de los días 30. El sistema detecta y retira automáticamente del listado activo a quienes cumplan los <strong>2 años de edad reglamentarios</strong> (O.G. N° 2551).
            </p>
          </div>

          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <button
              type="button"
              class="btn btn-sm"
              style="background: #334155; color: #ffffff; border: 1px solid #475569;"
              (click)="simuladorFecha.irADia30MesAnterior()"
              title="Retroceder al día 30 del mes anterior"
            >
              ⏮ Mes Anterior (Día 30)
            </button>
            <button
              type="button"
              class="btn btn-sm"
              style="background: #0284c7; color: #ffffff; border: 1px solid #0369a1; font-weight: 600;"
              (click)="simuladorFecha.irADia30MesActual()"
              title="Fijar en el día 30 del mes corriente"
            >
              ⚡ Día 30 Mes Actual
            </button>
            <button
              type="button"
              class="btn btn-sm"
              style="background: #334155; color: #ffffff; border: 1px solid #475569;"
              (click)="simuladorFecha.irADia30MesSiguiente()"
              title="Avanzar al día 30 del mes siguiente"
            >
              Mes Siguiente (Día 30) ⏭
            </button>
            <button
              type="button"
              class="btn btn-sm"
              style="background: #475569; color: #f8fafc;"
              (click)="simuladorFecha.irAHoyReal()"
              title="Volver a la fecha real"
            >
              ↺ Hoy Real
            </button>
            <input
              type="date"
              style="background: #1e293b; color: #ffffff; border: 1px solid #64748b; padding: 0.3rem 0.5rem; border-radius: 4px; font-size: 0.85rem;"
              [ngModel]="simuladorFecha.fechaFormatoIsoDate"
              (ngModelChange)="simuladorFecha.establecerFechaPorString($event)"
              title="Establecer fecha específica en el calendario"
            />
          </div>
        </div>
      </div>

      <!-- Barra de Navegación Interna del Coordinador: 1. Postulantes | 2. Lista de Pago | 3. Derechos Finalizados -->
      <div class="tabs-bar">
        <button
          class="tab-btn"
          [class.active]="vistaActiva === 'postulantes'"
          (click)="cambiarVista('postulantes')"
        >
          1. Vista de Postulantes ({{ postulacionesPendientes.length }})
        </button>
        <button
          class="tab-btn"
          [class.active]="vistaActiva === 'lista-pago'"
          (click)="cambiarVista('lista-pago')"
        >
          2. Vista de Lista de Pago Activa ({{ beneficiariasEnListaPagoVigentes.length }})
        </button>
        <button
          class="tab-btn"
          [class.active]="vistaActiva === 'derechos-finalizados'"
          (click)="cambiarVista('derechos-finalizados')"
          [style.color]="beneficiariasDerechoFinalizado.length > 0 && vistaActiva !== 'derechos-finalizados' ? '#dc2626' : ''"
        >
          3. Derechos Finalizados (Límite 2 Años) ({{ beneficiariasDerechoFinalizado.length }})
        </button>
      </div>

      <!-- ========================================================================= -->
      <!-- VISTA 1: POSTULANTES (REVISIÓN DOCUMENTAL Y NÚMERO DE RESOLUCIÓN)         -->
      <!-- ========================================================================= -->
      <div *ngIf="vistaActiva === 'postulantes'">
        <div class="card">
          <div class="card-header-flex">
            <div>
              <h2>Listado de Postulantes (Seleccione por RUT y Nombre para desplegar documentos)</h2>
              <p class="text-muted">
                El Coordinador visualiza los documentos cargados por la postulante directamente en la página y marca el check de <strong>Aprobado</strong> o <strong>No Aprobado</strong> (con observaciones). <em>El Coordinador no puede reemplazar la documentación del postulante.</em>
              </p>
            </div>
            <button class="btn btn-outline btn-sm" (click)="cargarDatosCoordinador()">
              Refrescar Postulantes
            </button>
          </div>

          <div *ngIf="postulacionesPendientes.length === 0" class="empty-state">
            <p>No existen postulaciones pendientes en este momento.</p>
          </div>

          <!-- Tabla de Postulantes: RUT y Nombre de la Persona -->
          <div class="table-responsive" *ngIf="postulacionesPendientes.length > 0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Solicitud</th>
                  <th>RUT Postulante</th>
                  <th>Nombre de la Persona</th>
                  <th>Región / Unidad</th>
                  <th>Documentos Cargados</th>
                  <th>Estado Actual</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  *ngFor="let sol of postulacionesPendientes"
                  [class.selected-row]="postulacionSeleccionada?.solicitudID === sol.solicitudID"
                  style="cursor: pointer;"
                  (click)="seleccionarPostulante(sol)"
                >
                  <td><strong>#{{ sol.solicitudID }}</strong></td>
                  <td><span class="mono-badge">{{ sol.funcionarioRut }}</span></td>
                  <td><strong>{{ sol.funcionarioNombreCompleto }}</strong></td>
                  <td>
                    <span class="side-badge">{{ sol.codigoRegion }}</span>
                    <small style="margin-left: 6px;">{{ sol.funcionarioUnidad || 'PDI' }}</small>
                  </td>
                  <td>
                    <strong>{{ sol.cantidadDocumentosSubidos }}</strong> archivo(s) PDF
                  </td>
                  <td>
                    <span class="badge-estado" [ngClass]="obtenerClaseEstadoSolicitud(sol.estado)">
                      {{ sol.estado }}
                    </span>
                  </td>
                  <td>
                    <button
                      class="btn btn-sm btn-primary"
                      (click)="seleccionarPostulante(sol); $event.stopPropagation()"
                    >
                      {{ postulacionSeleccionada?.solicitudID === sol.solicitudID ? 'Documentos Desplegados' : 'Seleccionar y Ver Documentos' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- PANEL DESPLEGADO AL SELECCIONAR UN POSTULANTE: DOCUMENTOS CARGADOS + VISOR EN PÁGINA -->
        <div class="card" *ngIf="postulacionSeleccionada as sel">
          <div class="card-header-flex">
            <div>
              <span class="badge-institucional">POSTULANTE SELECCIONADA — SOLICITUD #{{ sel.solicitudID }}</span>
              <h2 style="margin-top: 0.35rem;">
                {{ sel.funcionarioNombreCompleto }} — RUT: <span class="mono-badge">{{ sel.funcionarioRut }}</span>
              </h2>
              <p class="text-muted">
                Región: <strong>{{ sel.codigoRegion }}</strong> | Correo: {{ sel.funcionarioCorreo || 'S/C' }} | Estado: <strong>{{ sel.estado }}</strong>
              </p>
            </div>
            <button class="btn btn-outline btn-sm" (click)="cerrarSeleccionPostulante()">
              Cerrar Detalle ✕
            </button>
          </div>

          <div *ngIf="evaluacionesForm.length === 0" class="empty-state">
            <p>Esta postulante aún no ha subido archivos PDF en su portal de postulación.</p>
          </div>

          <!-- Split Layout: Izquierda = Documentos con Check Aprobado/No Aprobado y Observaciones | Derecha = Visor PDF en la misma página -->
          <div class="split-layout" *ngIf="evaluacionesForm.length > 0">
            <!-- Columna Izquierda: Lista de Documentos Cargados y Check de Aprobación -->
            <div class="split-main">
              <h3>Documentos Cargados por la Postulante (Solo Lectura y Revisión)</h3>
              <div
                *ngFor="let item of evaluacionesForm; let i = index"
                class="doc-slot-card"
                style="margin-bottom: 0.85rem;"
                [class.uploaded]="item.aprobado"
              >
                <div class="doc-slot-header">
                  <div>
                    <h4 style="margin: 0;">{{ i + 1 }}. {{ item.tipoDocumento }}</h4>
                    <small class="text-muted">
                      Archivo: <strong>{{ item.nombreArchivo }}</strong> ({{ item.fechaSubida | date:'dd/MM/yyyy HH:mm' }})
                    </small>
                  </div>
                  <div style="display: flex; gap: 0.45rem;">
                    <button
                      type="button"
                      class="btn btn-sm btn-primary"
                      (click)="verPdfEnPagina(item.documentoID, item.tipoDocumento + ' - ' + item.nombreArchivo)"
                    >
                      👁 Ver en Visor
                    </button>
                    <a
                      [href]="obtenerUrlDescarga(item.documentoID)"
                      target="_blank"
                      download
                      class="btn btn-sm btn-outline"
                      title="Descargar este archivo a su computadora"
                    >
                      ⬇ Descargar
                    </a>
                  </div>
                </div>

                <!-- Check de Aprobado o No Aprobado -->
                <div
                  style="display: flex; align-items: center; gap: 1.25rem; margin-top: 0.75rem; padding: 0.6rem; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;"
                >
                  <label style="display: flex; align-items: center; gap: 0.45rem; cursor: pointer; font-weight: 600; color: #15803d;">
                    <input
                      type="checkbox"
                      [checked]="item.aprobado"
                      (change)="alCambiarCheckAprobado(item, $any($event.target).checked)"
                      style="width: 18px; height: 18px; cursor: pointer;"
                    />
                    ✓ Documento Aprobado
                  </label>

                  <span
                    class="slot-badge"
                    [class.ok]="item.aprobado"
                    [class.pending]="!item.aprobado"
                  >
                    {{ item.aprobado ? 'APROBADO' : 'NO APROBADO (Requiere Observación)' }}
                  </span>
                </div>

                <!-- Campo de Observaciones cuando NO se aprueba el documento -->
                <div *ngIf="!item.aprobado" class="form-group" style="margin-top: 0.65rem;">
                  <label style="color: var(--danger); font-weight: 600;">
                    Observaciones del rechazo para "{{ item.tipoDocumento }}" *
                  </label>
                  <textarea
                    rows="2"
                    class="input-control"
                    [(ngModel)]="item.observacion"
                    placeholder="Indique detalladamente por qué no se aprueba este documento y qué debe corregir el postulante..."
                  ></textarea>
                </div>
              </div>

              <!-- Botón para Guardar la Revisión de los Documentos -->
              <div class="sync-panel" style="margin-top: 1rem;">
                <div class="form-group">
                  <label>Observación General de la Revisión (Opcional)</label>
                  <input
                    type="text"
                    class="input-control"
                    [(ngModel)]="observacionGeneralCoordinador"
                    placeholder="Comentarios adicionales del Coordinador..."
                  />
                </div>

                <div class="form-actions" style="margin-top: 0.85rem;">
                  <button
                    class="btn"
                    [ngClass]="todosLosDocumentosMarcadosAprobados() ? 'btn-success' : 'btn-danger'"
                    (click)="guardarRevisionDocumentos()"
                  >
                    {{
                      todosLosDocumentosMarcadosAprobados()
                        ? '✓ Aprobar Toda la Documentación (Dejar en Espera de N° de Resolución)'
                        : '✕ Guardar Rechazo / Observaciones para Corrección del Postulante'
                    }}
                  </button>
                </div>
              </div>

              <!-- SECCIÓN: ESPERA DE NÚMERO DE RESOLUCIÓN (Solo se habilita cuando toda la documentación fue aprobada) -->
              <div
                class="sync-panel"
                *ngIf="sel.estado === 'En Espera Resolucion' && todosLosDocumentosMarcadosAprobados()"
                style="margin-top: 1.25rem; border: 2px solid #16a34a; background: #f0fdf4;"
              >
                <span class="badge-institucional" style="background: #15803d; color: #fff;">
                  DOCUMENTACIÓN 100% APROBADA — EN ESPERA DE NÚMERO DE RESOLUCIÓN
                </span>
                <h3 style="margin-top: 0.5rem;">
                  Ingresar Número de Resolución para Incorporar a la Lista de Pago
                </h3>
                <div class="grid-form">
                  <div class="form-group">
                    <label>Número de Resolución de Aprobación *</label>
                    <input
                      type="text"
                      class="input-control"
                      [(ngModel)]="formResolucion.numeroResolucion"
                      placeholder="Ej: RES-BIENESTAR-2026-00142"
                    />
                  </div>
                  <div class="form-group">
                    <label>Fecha de Resolución *</label>
                    <input
                      type="date"
                      class="input-control"
                      [(ngModel)]="formResolucion.fechaResolucion"
                    />
                  </div>
                  <div class="form-group">
                    <label>Monto Mensual Base Aprobado (CLP &#36;) *</label>
                    <input
                      type="number"
                      min="10000"
                      class="input-control"
                      [(ngModel)]="formResolucion.montoMensualAprobado"
                    />
                  </div>
                </div>
                <div class="form-actions">
                  <button
                    class="btn btn-primary"
                    [disabled]="guardandoResolucion"
                    (click)="asociarResolucionEIngresarAListaPago(sel)"
                  >
                    {{ guardandoResolucion ? 'Emitiendo Resolución...' : '✓ Asociar N° de Resolución e Ingresar a Lista de Pago Activa →' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Columna Derecha: Visor de PDF Integrado en la Página -->
            <div class="split-side">
              <div class="folder-viewer-card" style="position: sticky; top: 1rem;">
                <div class="folder-header">
                  <div>
                    <span class="badge-institucional">VISOR DOCUMENTAL EN PÁGINA</span>
                    <h3 style="margin-top: 0.25rem;">
                      {{ pdfEnPaginaTitulo || 'Seleccione un documento para visualizarlo' }}
                    </h3>
                  </div>
                  <div style="display: flex; gap: 0.45rem;" *ngIf="pdfEnPaginaRawUrl">
                    <a
                      [href]="pdfEnPaginaDescargaUrl"
                      target="_blank"
                      download
                      class="btn btn-sm btn-outline"
                      title="Descargar este archivo PDF"
                    >
                      ⬇ Descargar
                    </a>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline"
                      (click)="cerrarVisorPdf()"
                      title="Cerrar visor"
                    >
                      ✕ Cerrar
                    </button>
                  </div>
                </div>

                <div *ngIf="!pdfEnPaginaUrl" class="empty-state" style="padding: 3rem 1rem;">
                  <p>Haga clic en <strong>"👁 Ver en Visor"</strong> en cualquiera de los documentos de la lista para inspeccionarlo en este visor sin descargarlo.</p>
                </div>

                <div *ngIf="pdfEnPaginaUrl" style="height: 540px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
                  <iframe
                    [src]="pdfEnPaginaUrl"
                    style="width: 100%; height: 100%; border: none;"
                    title="Visor PDF en Página Coordinador"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- VISTA 2: LISTA DE PAGO ACTIVA Y CONTROL MENSUAL DÍA 30                    -->
      <!-- ========================================================================= -->
      <div *ngIf="vistaActiva === 'lista-pago'">

        <!-- AVISO COMPACTO DE BENEFICIOS EGRESADOS POR LÍMITE DE EDAD (2 AÑOS) -->
        <div
          class="novedad-alert con-novedad"
          *ngIf="beneficiariasDerechoFinalizado.length > 0"
          style="margin-bottom: 1.25rem; background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; padding: 0.85rem 1.15rem; border-radius: 8px;"
        >
          <div style="display: flex; gap: 0.6rem; align-items: center;">
            <span style="font-size: 1.4rem;">🚨</span>
            <div>
              <strong>{{ beneficiariasDerechoFinalizado.length }} beneficio(s) egresaron del listado activo</strong> al haber cumplido el menor 2 años de edad (O.G. N° 2551).
              <div style="font-size: 0.82rem; color: #7f1d1d;">Fueron trasladados automáticamente a la pestaña exclusiva de "Derechos Finalizados".</div>
            </div>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-outline"
            style="border-color: #dc2626; color: #dc2626; background: #ffffff; font-weight: 700;"
            (click)="cambiarVista('derechos-finalizados')"
          >
            Ver en Pestaña 3: Derechos Finalizados →
          </button>
        </div>

        <!-- Bloque A: Nómina Oficial en Lista de Pago Activa (Beneficiarias Vigentes Con Derecho) -->
        <div class="card">
          <div class="card-header-flex">
            <div>
              <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                <span class="badge-institucional" style="background: #0284c7; color: #ffffff;">NÓMINA DE COBRO VIGENTE</span>
                <span class="mono-badge" style="background: #e0f2fe; color: #0369a1;">
                  {{ beneficiariasEnListaPagoVigentes.length }} Beneficiaria(s) Vigente(s)
                </span>
              </div>
              <h2 style="margin-top: 0.35rem;">1. Nómina Oficial en Lista de Pago Activa (Menores Menores de 2 Años)</h2>
              <p class="text-muted">
                Beneficiarias con <strong>Resolución aprobada</strong> y cuyo hijo(a) causante tiene <strong>menos de 2 años de edad</strong> en la fecha de corte simulada (<strong>{{ simuladorFecha.fechaActual | date:'dd/MM/yyyy' }}</strong>).
              </p>
            </div>
            <button class="btn btn-outline btn-sm" (click)="cargarDatosCoordinador()">
              Refrescar Lista de Pago
            </button>
          </div>

          <div *ngIf="beneficiariasEnListaPagoVigentes.length === 0" class="empty-state" style="padding: 2.5rem 1rem;">
            <p>
              {{ beneficiariasEnListaPago.length > 0
                ? 'Todas las beneficiarias de la nómina han cumplido los 2 años de edad y egresaron del listado de pago activo (ver registro histórico más abajo).'
                : 'Aún no existen beneficiarias activas en la Lista de Pago.' }}
            </p>
          </div>

          <div class="table-responsive" *ngIf="beneficiariasEnListaPagoVigentes.length > 0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Solicitud</th>
                  <th>RUT</th>
                  <th>Nombre de la Beneficiaria</th>
                  <th>Región</th>
                  <th>Menor Causante</th>
                  <th>Edad Menor (Corte 2 Años)</th>
                  <th>N° Resolución</th>
                  <th>Monto Base</th>
                  <th>Estado Beneficio</th>
                  <th>Estado Período (Corte Día 30)</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  *ngFor="let ben of beneficiariasEnListaPagoVigentes"
                  [class.selected-row]="beneficiariaSeleccionada?.solicitudID === ben.solicitudID"
                  (click)="seleccionarBeneficiariaListaPago(ben)"
                  style="cursor: pointer;"
                >
                  <td><strong>#{{ ben.solicitudID }}</strong></td>
                  <td><span class="mono-badge">{{ ben.funcionarioRut }}</span></td>
                  <td><strong>{{ ben.funcionarioNombreCompleto }}</strong></td>
                  <td><span class="side-badge">{{ ben.codigoRegion }}</span></td>
                  <td>
                    <div><strong>{{ ben.nombreMenor || 'Lactante causante' }}</strong></div>
                    <small class="text-muted">F.Nac: {{ (ben.fechaNacimientoMenor | date:'dd/MM/yyyy') || '15/03/2024' }}</small>
                  </td>
                  <td>
                    <span class="slot-badge ok" style="font-weight: 600;">
                      {{ calcularEdadDetalle(ben.fechaNacimientoMenor) }}
                    </span>
                    <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.2rem;">
                      Límite: {{ (calcularFechaCumple2Anos(ben.fechaNacimientoMenor) | date:'dd/MM/yyyy') || '15/03/2026' }}
                    </div>
                  </td>
                  <td><strong>{{ ben.resolucion?.numeroResolucion }}</strong></td>
                  <td>
                    <strong style="color: var(--success);">
                      &#36;{{ ben.resolucion?.montoMensualAprobado || ben.montoMensualBase | number:'1.0-0' }}
                    </strong>
                  </td>
                  <td>
                    <span class="badge-estado badge-aprobada">VIGENTE EN PAGO</span>
                  </td>
                  <td>
                    <span class="badge-estado" [ngClass]="obtenerClaseBadgePeriodo(ben.solicitudID)">
                      {{ obtenerEstadoPeriodoBeneficiaria(ben.solicitudID) | uppercase }}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      class="btn btn-sm btn-primary"
                      (click)="seleccionarBeneficiariaListaPago(ben); $event.stopPropagation()"
                    >
                      {{ beneficiariaSeleccionada?.solicitudID === ben.solicitudID ? 'Expediente Desplegado' : 'Seleccionar y Revisar Día 30' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- PANEL DESPLEGADO AL SELECCIONAR UNA BENEFICIARIA DE LA LISTA DE PAGO -->
        <div class="card" *ngIf="beneficiariaSeleccionada as selBen">
          <div class="card-header-flex">
            <div>
              <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                <span class="badge-institucional" style="background: #15803d; color: #ffffff;">
                  BENEFICIARIA ACTIVA — SOLICITUD #{{ selBen.solicitudID }}
                </span>
                <span class="badge-institucional" [ngClass]="obtenerClaseBadgePeriodo(selBen.solicitudID)" style="font-weight: 700;">
                  ESTADO PERÍODO ({{ obtenerNombreMes(formConfirmacionDia30.mes) | uppercase }} {{ formConfirmacionDia30.anio }}): {{ obtenerEstadoPeriodoBeneficiaria(selBen.solicitudID) | uppercase }}
                </span>
              </div>
              <h2 style="margin-top: 0.35rem;">
                {{ selBen.funcionarioNombreCompleto }} — RUT: <span class="mono-badge">{{ selBen.funcionarioRut }}</span>
              </h2>
              <p class="text-muted">
                Resolución: <strong>{{ selBen.resolucion?.numeroResolucion }}</strong> | Región: <strong>{{ selBen.codigoRegion }}</strong> | Monto Base: <strong>&#36;{{ (selBen.resolucion?.montoMensualAprobado || selBen.montoMensualBase) | number:'1.0-0' }}</strong>
              </p>
            </div>
            <button class="btn btn-outline btn-sm" (click)="cerrarDetalleBeneficiaria()">
              Cerrar Detalle ✕
            </button>
          </div>

          <!-- Alerta de Beneficio Finalizado por Límite de Edad si corresponde -->
          <div
            class="novedad-alert con-novedad"
            *ngIf="esDerechoFinalizado(selBen)"
            style="margin-bottom: 1rem; border: 2px solid #ef4444; background: #fee2e2; color: #991b1b; padding: 0.85rem 1rem;"
          >
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <span style="font-size: 1.3rem;">🛑</span>
              <div>
                <strong>BENEFICIO FINALIZADO POR LÍMITE DE EDAD (2 AÑOS CUMPLIDOS):</strong><br />
                El menor causante <strong>{{ selBen.nombreMenor || 'Lactante causante' }}</strong> cumplió los 2 años reglamentarios el <strong>{{ (calcularFechaCumple2Anos(selBen.fechaNacimientoMenor) | date:'dd/MM/yyyy') || '15/03/2026' }}</strong>.
                Este expediente se encuentra egresado de la nómina activa de pagos en conformidad a la <strong>Orden General N° 2551</strong> y el Art. 203 del Código del Trabajo.
                <div *ngIf="selBen.observacionesCoordinador" style="margin-top: 0.35rem; font-weight: 600;">
                  📝 Observaciones registradas en el expediente: {{ selBen.observacionesCoordinador }}
                </div>
              </div>
            </div>
          </div>

          <!-- Split Layout: Columna Izquierda = Documentos Iniciales + Declaración Beneficiaria + Confirmación Coordinador | Columna Derecha = Visor PDF en Página -->
          <div class="split-layout">
            <div class="split-main">
              <!-- 1. DOCUMENTACIÓN INICIAL APROBADA DE LA BENEFICIARIA -->
              <div class="card" style="margin-bottom: 1.25rem; border-left: 4px solid #0284c7;">
                <h3 style="margin-top: 0;">1. Documentación Inicial Aprobada (Carpeta Virtual)</h3>
                <p class="text-muted" style="font-size: 0.85rem;">
                  Documentos legales cargados por la funcionaria y validados para la emisión de la Resolución.
                </p>

                <div class="table-responsive" *ngIf="selBen.documentosIniciales && selBen.documentosIniciales.length > 0">
                  <table class="data-table" style="font-size: 0.85rem;">
                    <thead>
                      <tr>
                        <th>Tipo Documento</th>
                        <th>Nombre Archivo</th>
                        <th>Fecha Subida</th>
                        <th>Estado</th>
                        <th>Visualización</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let doc of selBen.documentosIniciales">
                        <td><strong>{{ doc.tipoDocumento }}</strong></td>
                        <td>{{ doc.nombreArchivo }}</td>
                        <td>{{ doc.fechaSubida | date:'dd/MM/yyyy HH:mm' }}</td>
                        <td><span class="slot-badge ok">APROBADO</span></td>
                        <td>
                          <div style="display: flex; gap: 0.35rem;">
                            <button
                              type="button"
                              class="btn btn-sm btn-primary"
                              (click)="verPdfEnPagina(doc.documentoID, doc.tipoDocumento + ' - ' + doc.nombreArchivo)"
                            >
                              👁 Ver en Visor
                            </button>
                            <a
                              [href]="obtenerUrlDescarga(doc.documentoID)"
                              target="_blank"
                              download
                              class="btn btn-sm btn-outline"
                              title="Descargar archivo"
                            >
                              ⬇
                            </a>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- 2. DECLARACIÓN DEL DÍA 30 DE LA BENEFICIARIA (VERIFICACIÓN) -->
              <div class="card" style="margin-bottom: 1.25rem; border-left: 4px solid #16a34a;">
                <h3 style="margin-top: 0;">
                  2. Declaración de la Funcionaria — Período: {{ obtenerNombreMes(formConfirmacionDia30.mes) }} {{ formConfirmacionDia30.anio }}
                </h3>

                <!-- Caso A: La funcionaria ya ingresó su declaración para este mes -->
                <div *ngIf="obtenerControlPeriodoActual(selBen.solicitudID) as cBen">
                  <div
                    class="novedad-alert"
                    [class.sin-novedad]="!cBen.tuvoCausalDescuento"
                    [class.con-novedad]="cBen.tuvoCausalDescuento"
                    style="margin-bottom: 0.75rem;"
                  >
                    <div *ngIf="!cBen.tuvoCausalDescuento">
                      ✔ <strong>Declaración de la Beneficiaria:</strong> Confirmó que <strong>SÍ trabajó los 30 días completos</strong> (Sin feriado legal, permisos administrativos ni licencia médica).
                      <div style="margin-top: 0.35rem;">Días declarados: <strong>30 / 30 efectivos</strong> — Monto: <strong>&#36;{{ cBen.montoProporcionalCalculado | number:'1.0-0' }}</strong></div>
                    </div>
                    <div *ngIf="cBen.tuvoCausalDescuento">
                      ⚠ <strong>Declaración de la Beneficiaria:</strong> Declaró que <strong>NO trabajó completo</strong> (Hizo uso de causales de descuento):
                      <div style="margin-top: 0.35rem; display: flex; gap: 1rem; flex-wrap: wrap;">
                        <span>Feriado Legal: <strong>{{ cBen.diasFeriadoLegal }} días</strong></span>
                        <span>Días Administrativos: <strong>{{ cBen.diasAdministrativos }} días</strong></span>
                        <span>Licencia Médica: <strong>{{ cBen.diasLicenciaMedica }} días</strong></span>
                        <span>Total Descontado: <strong>{{ cBen.diasDescontadosTotales }} días</strong></span>
                        <span>Días Efectivos: <strong>{{ cBen.diasEfectivos }}/30 días</strong></span>
                      </div>
                    </div>
                  </div>

                  <!-- Botón para ver el respaldo adjuntado por la funcionaria si existe -->
                  <div *ngIf="cBen.rutaArchivoRespaldo" style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.5rem; padding: 0.5rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
                    <span style="font-size: 0.85rem; font-weight: 600;">Documento de Respaldo Adjuntado por la Beneficiaria:</span>
                    <button
                      type="button"
                      class="btn btn-sm btn-primary"
                      (click)="verPdfRespaldoEnPagina(cBen.controlID, 'Respaldo Beneficiaria ' + obtenerNombreMes(cBen.mes) + ' ' + cBen.anio)"
                    >
                      👁 Ver Respaldo en Visor
                    </button>
                    <a
                      [href]="obtenerUrlDescargaRespaldo(cBen.controlID)"
                      target="_blank"
                      download
                      class="btn btn-sm btn-outline"
                    >
                      ⬇ Descargar Respaldo
                    </a>
                  </div>
                  <div *ngIf="!cBen.rutaArchivoRespaldo" class="text-muted" style="font-size: 0.85rem; margin-top: 0.35rem;">
                    (La funcionaria no adjuntó archivo de respaldo adicional).
                  </div>
                </div>

                <!-- Caso B: La funcionaria aún no envía su declaración -->
                <div *ngIf="!obtenerControlPeriodoActual(selBen.solicitudID)" class="novedad-alert" style="background: #fefce8; border-color: #facc15; color: #854d0e;">
                  ℹ <strong>Pendiente de Notificación:</strong> La funcionaria aún no ingresa su declaración del Día 30 para el período <strong>{{ obtenerNombreMes(formConfirmacionDia30.mes) }} {{ formConfirmacionDia30.anio }}</strong>. El Coordinador puede registrar la confirmación institucional a continuación.
                </div>
              </div>

              <!-- 3. FORMULARIO DE CONFIRMACIÓN INSTITUCIONAL DEL COORDINADOR (DATOS OFICIALES) -->
              <div class="card" style="border-left: 4px solid #f59e0b;">
                <h3 style="margin-top: 0;">3. Confirmación Institucional y Validación del Coordinador</h3>
                <p class="text-muted" style="font-size: 0.85rem;">
                  Confirme la situación oficial de asistencia de la funcionaria durante el período de 30 días. Si no trabajó completo, indique los días que faltó para que se resten y adjunte el documento oficial.
                </p>

                <div class="grid-form">
                  <div class="form-group">
                    <label>Año de Evaluación *</label>
                    <input type="number" class="input-control" [(ngModel)]="formConfirmacionDia30.anio" />
                  </div>
                  <div class="form-group">
                    <label>Mes de Evaluación (Corte Día 30) *</label>
                    <select class="input-control" [(ngModel)]="formConfirmacionDia30.mes">
                      <option *ngFor="let m of meses" [ngValue]="m.numero">{{ m.nombre }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>¿Confirma usted que la funcionaria trabajó los 30 días completos? *</label>
                    <select
                      class="input-control"
                      [(ngModel)]="formConfirmacionDia30.confirmaTrabajo30Dias"
                      (ngModelChange)="alCambiarConfirmaTrabajo($event)"
                    >
                      <option [ngValue]="true">SÍ — Trabajó los 30 días completos (Sin novedades ni causales)</option>
                      <option [ngValue]="false">NO — No trabajó completo (Indicar días que faltó)</option>
                    </select>
                  </div>
                </div>

                <!-- Desglose de días que faltó (solo si indica NO) -->
                <div class="grid-form" *ngIf="!formConfirmacionDia30.confirmaTrabajo30Dias" style="margin-top: 0.85rem; padding: 0.85rem; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px;">
                  <div class="form-group">
                    <label>Días de Feriado Legal ($\ge 0$)</label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      class="input-control"
                      [(ngModel)]="formConfirmacionDia30.diasFeriadoLegal"
                    />
                  </div>
                  <div class="form-group">
                    <label>Días Administrativos ($\ge 0$)</label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      class="input-control"
                      [(ngModel)]="formConfirmacionDia30.diasAdministrativos"
                    />
                  </div>
                  <div class="form-group">
                    <label>Días de Licencia Médica ($\ge 0$)</label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      class="input-control"
                      [(ngModel)]="formConfirmacionDia30.diasLicenciaMedica"
                    />
                  </div>
                </div>

                <!-- Cuadro de Cálculo Proporcional Automático sobre Base de 30 Días -->
                <div
                  class="novedad-alert"
                  [class.sin-novedad]="formConfirmacionDia30.confirmaTrabajo30Dias"
                  [class.con-novedad]="!formConfirmacionDia30.confirmaTrabajo30Dias"
                  style="margin-top: 0.95rem;"
                >
                  <strong>Cálculo Proporcional Institucional (Base 30 Días):</strong><br />
                  <span *ngIf="formConfirmacionDia30.confirmaTrabajo30Dias">
                    Total Días Efectivos: <strong>30 / 30 días</strong> — Monto Proporcional a Pagar: <strong>&#36;{{ (selBen.resolucion?.montoMensualAprobado || selBen.montoMensualBase) | number:'1.0-0' }}</strong>
                  </span>
                  <span *ngIf="!formConfirmacionDia30.confirmaTrabajo30Dias">
                    Días que Faltó (Descontados): <strong>{{ calcularDiasFaltantesCoordinador() }} días</strong> |
                    Días Efectivos Resultantes: <strong>{{ calcularDiasEfectivosCoordinador() }} / 30 días</strong> —
                    Monto Proporcional a Pagar: <strong>&#36;{{ calcularMontoProporcionalCoordinador() | number:'1.0-0' }}</strong>
                  </span>
                </div>

                <!-- Adjuntar Documento de Respaldo Oficial -->
                <div class="form-group" style="margin-top: 0.95rem;">
                  <label>
                    Adjuntar Documento de Respaldo Oficial en PDF
                    <span *ngIf="!formConfirmacionDia30.confirmaTrabajo30Dias" style="color: var(--danger); font-weight: 700;">* (Obligatorio si faltó días)</span>
                    <span *ngIf="formConfirmacionDia30.confirmaTrabajo30Dias" class="text-muted">(Opcional si trabajó los 30 días)</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    class="input-control"
                    (change)="alSeleccionarArchivoRespaldoCoordinador($event)"
                  />
                  <small class="text-muted">
                    Suba el decreto, certificado médico o constancia institucional que respalda los días descontados.
                  </small>
                </div>

                <!-- Observaciones del Coordinador -->
                <div class="form-group" style="margin-top: 0.85rem;">
                  <label>Observaciones de Validación Institucional (Para Visador)</label>
                  <textarea
                    rows="2"
                    class="input-control"
                    [(ngModel)]="formConfirmacionDia30.observaciones"
                    placeholder="Ej: Verificado conforme por Coordinador. Días y respaldo validados institucionalmente."
                  ></textarea>
                </div>

                <!-- Botones de Acción -->
                <div class="form-actions" style="margin-top: 1rem; display: flex; gap: 0.75rem; flex-wrap: wrap;">
                  <button
                    type="button"
                    class="btn btn-success"
                    [disabled]="guardandoConfirmacionDia30 || esDerechoFinalizado(selBen)"
                    (click)="confirmarYDarVistoBuenoCoordinador(selBen)"
                  >
                    {{
                      esDerechoFinalizado(selBen)
                        ? '🛑 Beneficio Finalizado por Límite de Edad (2 Años) — Visto Bueno Inhabilitado'
                        : (guardandoConfirmacionDia30 ? 'Procesando Visto Bueno...' : '✓ Confirmar y Otorgar Visto Bueno Institucional → Derivar a Visador')
                    }}
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline"
                    (click)="cerrarDetalleBeneficiaria()"
                  >
                    Cerrar Detalle
                  </button>
                </div>
              </div>
            </div>

            <!-- Columna Derecha: Visor de PDF Integrado en la Página para la Beneficiaria -->
            <div class="split-side">
              <div class="folder-viewer-card" style="position: sticky; top: 1rem;">
                <div class="folder-header">
                  <div>
                    <span class="badge-institucional">VISOR DOCUMENTAL EN PÁGINA</span>
                    <h3 style="margin-top: 0.25rem;">
                      {{ pdfEnPaginaTitulo || 'Seleccione un documento para visualizarlo' }}
                    </h3>
                  </div>
                  <div style="display: flex; gap: 0.45rem;" *ngIf="pdfEnPaginaRawUrl">
                    <a
                      [href]="pdfEnPaginaDescargaUrl"
                      target="_blank"
                      download
                      class="btn btn-sm btn-outline"
                      title="Descargar este archivo PDF"
                    >
                      ⬇ Descargar
                    </a>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline"
                      (click)="cerrarVisorPdf()"
                      title="Cerrar visor"
                    >
                      ✕ Cerrar
                    </button>
                  </div>
                </div>

                <div *ngIf="!pdfEnPaginaUrl" class="empty-state" style="padding: 3rem 1rem;">
                  <p>Haga clic en <strong>"👁 Ver en Visor"</strong> en cualquiera de los documentos iniciales o en el respaldo del Día 30 para inspeccionarlo aquí en pantalla sin descargarlo.</p>
                </div>

                <div *ngIf="pdfEnPaginaUrl" style="height: 580px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
                  <iframe
                    [src]="pdfEnPaginaUrl"
                    style="width: 100%; height: 100%; border: none;"
                    title="Visor PDF Coordinador Lista de Pago"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bloque B: Declaraciones Mensuales del Día 30 para Visto Bueno o Cancelación del Coordinador -->
        <div class="card">
          <h2>2. Declaraciones Mensuales (Día 30) de la Lista de Pago — Visto Bueno o Cancelación</h2>
          <p class="text-muted">
            Revise las notificaciones del <strong>Día 30</strong> enviadas por las beneficiarias de la Lista de Pago (o devueltas por el Visador) para otorgar el <strong>Visto Bueno Definitivo</strong> (avanzando al Visador) o <strong>Cancelar el Beneficio</strong>.
          </p>

          <div *ngIf="controlesMensualesListaPago.length === 0" class="empty-state">
            <p>No existen declaraciones mensuales del Día 30 registradas aún.</p>
          </div>

          <div class="table-responsive" *ngIf="controlesMensualesListaPago.length > 0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>RUT / Nombre Beneficiaria</th>
                  <th>Período</th>
                  <th>N° Resolución</th>
                  <th>¿Uso Causal?</th>
                  <th>Días Efectivos</th>
                  <th>Monto Proporcional</th>
                  <th>Estado Circuito</th>
                  <th>Observación Visador</th>
                  <th>Acción Coordinador</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of controlesMensualesListaPago">
                  <td><strong>#{{ c.controlID }}</strong></td>
                  <td>
                    <div><strong>{{ c.funcionarioNombreCompleto }}</strong></div>
                    <small class="mono-badge">{{ c.funcionarioRut }}</small>
                  </td>
                  <td><strong>{{ obtenerNombreMes(c.mes) }} {{ c.anio }}</strong></td>
                  <td><span class="mono-badge">{{ c.numeroResolucion || 'Vigente' }}</span></td>
                  <td>
                    {{ c.tuvoCausalDescuento ? 'SÍ (Fer:' + c.diasFeriadoLegal + ' Adm:' + c.diasAdministrativos + ' Lic:' + c.diasLicenciaMedica + ')' : 'NO (30 días)' }}
                  </td>
                  <td><strong>{{ c.diasEfectivos }} / 30</strong></td>
                  <td>
                    <strong style="color: var(--primary);">
                      &#36;{{ c.montoProporcionalCalculado | number:'1.0-0' }}
                    </strong>
                  </td>
                  <td>
                    <span class="badge-estado" [ngClass]="obtenerClaseEstadoFlujo(c.estadoFlujo)">
                      {{ c.estadoFlujo }}
                    </span>
                  </td>
                  <td>
                    <span *ngIf="c.observacionVisador" class="obs-return">{{ c.observacionVisador }}</span>
                    <span *ngIf="!c.observacionVisador" class="text-muted">—</span>
                  </td>
                  <td>
                    <div
                      class="btn-group"
                      *ngIf="c.estadoFlujo === 'Notificado Dia 30' || c.estadoFlujo === 'Devuelto a Coordinador'"
                    >
                      <button
                        class="btn btn-sm btn-success"
                        (click)="darVistoBuenoCoordinador(c)"
                      >
                        ✓ Visto Bueno → Visador
                      </button>
                      <button
                        class="btn btn-sm btn-danger"
                        (click)="cancelarBeneficioCoordinador(c)"
                      >
                        ✕ Cancelar Beneficio
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- VISTA 3: DERECHOS FINALIZADOS (LÍMITE LEGAL 2 AÑOS - O.G. N° 2551)        -->
      <!-- ========================================================================= -->
      <div *ngIf="vistaActiva === 'derechos-finalizados'">
        <div class="card" style="border-top: 4px solid #dc2626;">
          <div class="card-header-flex">
            <div>
              <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                <span class="badge-institucional" style="background: #991b1b; color: #ffffff;">
                  3. MÓDULO DE TÉRMINO DE BENEFICIO
                </span>
                <span class="badge-institucional" style="background: #fee2e2; color: #991b1b; font-weight: 700;">
                  CORTE LEGAL 2 AÑOS CUMPLIDOS (O.G. N° 2551 / ART. 203 C. DEL TRABAJO)
                </span>
              </div>
              <h2 style="margin-top: 0.35rem; color: #991b1b;">
                Registro Oficial de Derechos Finalizados por Límite de Edad (2 Años)
              </h2>
              <p class="text-muted">
                Nómina exclusiva de funcionarias cuyos hijos(as) causantes han alcanzado o superado los <strong>2 años de edad</strong> en la fecha simulada (<strong>{{ simuladorFecha.fechaActual | date:'dd/MM/yyyy' }}</strong>). Han sido <strong>retiradas del listado de pago activo</strong> para evitar cobros improcedentes, conservando su trazabilidad histórica, expediente y observaciones.
              </p>
            </div>
            <button class="btn btn-outline btn-sm" (click)="cargarDatosCoordinador()">
              Refrescar Nómina
            </button>
          </div>

          <!-- Banner Informativo -->
          <div
            class="novedad-alert con-novedad"
            *ngIf="beneficiariasDerechoFinalizado.length > 0"
            style="margin-bottom: 1.25rem; border: 2px solid #ef4444; background: #fef2f2; color: #991b1b; padding: 1.15rem; border-radius: 8px;"
          >
            <div style="display: flex; gap: 0.85rem; align-items: flex-start;">
              <span style="font-size: 2rem; line-height: 1;">🚨</span>
              <div style="flex: 1;">
                <h3 style="margin: 0 0 0.35rem 0; color: #b91c1c; font-size: 1.1rem; font-weight: 700;">
                  ALERTA COORDINADOR: {{ beneficiariasDerechoFinalizado.length }} BENEFICIO(S) EGRESADO(S) POR CUMPLIMIENTO DE EDAD
                </h3>
                <p style="margin: 0; font-size: 0.88rem; color: #7f1d1d;">
                  Conforme a la Orden General N° 2551, el derecho al Bono Compensatorio de Sala Cuna se extingue el día en que el menor causante cumple los 2 años. Se exhibe a continuación el registro con las observaciones correspondientes.
                </p>
              </div>
            </div>
          </div>

          <div *ngIf="beneficiariasDerechoFinalizado.length === 0" class="empty-state" style="padding: 3rem 1rem;">
            <p>
              ✔ No hay beneficiarias con derecho finalizado para la fecha simulada (<strong>{{ simuladorFecha.fechaActual | date:'dd/MM/yyyy' }}</strong>).<br />
              Todos los menores causantes de las beneficiarias activas tienen menos de 2 años de edad.
            </p>
          </div>

          <!-- Tabla de Beneficiarias con Derecho Finalizado -->
          <div class="table-responsive" *ngIf="beneficiariasDerechoFinalizado.length > 0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Solicitud</th>
                  <th>RUT</th>
                  <th>Nombre de la Funcionaria</th>
                  <th>Región</th>
                  <th>Menor Causante</th>
                  <th>Fecha Nacimiento</th>
                  <th>Fecha Fin de Cobertura (2 Años)</th>
                  <th>Resolución</th>
                  <th>Estado del Beneficio</th>
                  <th>Observaciones del Expediente</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  *ngFor="let fin of beneficiariasDerechoFinalizado"
                  [class.selected-row]="beneficiariaFinalizadaSeleccionada?.solicitudID === fin.solicitudID"
                  (click)="seleccionarBeneficiariaFinalizada(fin)"
                  style="cursor: pointer;"
                >
                  <td><strong>#{{ fin.solicitudID }}</strong></td>
                  <td><span class="mono-badge">{{ fin.funcionarioRut }}</span></td>
                  <td><strong>{{ fin.funcionarioNombreCompleto }}</strong></td>
                  <td><span class="side-badge">{{ fin.codigoRegion }}</span></td>
                  <td>
                    <div><strong>{{ fin.nombreMenor || 'Lactante causante' }}</strong></div>
                    <small class="mono-badge">{{ fin.rutMenor || 'S/R' }}</small>
                  </td>
                  <td>{{ (fin.fechaNacimientoMenor | date:'dd/MM/yyyy') || '15/03/2024' }}</td>
                  <td>
                    <strong style="color: #dc2626;">
                      {{ (calcularFechaCumple2Anos(fin.fechaNacimientoMenor) | date:'dd/MM/yyyy') || '15/03/2026' }}
                    </strong>
                  </td>
                  <td><span class="mono-badge">{{ fin.resolucion?.numeroResolucion }}</span></td>
                  <td>
                    <span class="badge-estado" style="background: #fee2e2; color: #991b1b; border: 1px solid #f87171; font-weight: 700;">
                      DERECHO FINALIZADO
                    </span>
                  </td>
                  <td>
                    <div *ngIf="fin.observacionesCoordinador || fin.motivoRechazoCorrecciones" style="font-size: 0.82rem; color: #881337; font-weight: 600;">
                      📝 {{ fin.observacionesCoordinador || fin.motivoRechazoCorrecciones }}
                    </div>
                    <span *ngIf="!fin.observacionesCoordinador && !fin.motivoRechazoCorrecciones" class="text-muted">—</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline"
                      (click)="seleccionarBeneficiariaFinalizada(fin); $event.stopPropagation()"
                    >
                      {{ beneficiariaFinalizadaSeleccionada?.solicitudID === fin.solicitudID ? 'Expediente Desplegado' : 'Consultar Expediente' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- PANEL DE CONSULTA DE EXPEDIENTE FINALIZADO (SOLO LECTURA) -->
        <div class="card" *ngIf="beneficiariaFinalizadaSeleccionada as selFin" style="margin-top: 1.25rem;">
          <div class="card-header-flex">
            <div>
              <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                <span class="badge-institucional" style="background: #dc2626; color: #ffffff;">
                  EXPEDIENTE FINALIZADO — SOLICITUD #{{ selFin.solicitudID }}
                </span>
                <span class="badge-institucional" style="background: #fee2e2; color: #991b1b; font-weight: 700;">
                  MODO SÓLO CONSULTA (PAGOS INHABILITADOS)
                </span>
              </div>
              <h2 style="margin-top: 0.35rem; color: #991b1b;">
                {{ selFin.funcionarioNombreCompleto }} — RUT: <span class="mono-badge">{{ selFin.funcionarioRut }}</span>
              </h2>
              <p class="text-muted">
                Resolución: <strong>{{ selFin.resolucion?.numeroResolucion }}</strong> | Región: <strong>{{ selFin.codigoRegion }}</strong> | Monto Base: <strong>&#36;{{ (selFin.resolucion?.montoMensualAprobado || selFin.montoMensualBase) | number:'1.0-0' }}</strong>
              </p>
            </div>
            <button class="btn btn-outline btn-sm" (click)="cerrarDetalleBeneficiariaFinalizada()">
              Cerrar Detalle ✕
            </button>
          </div>

          <!-- Split Layout: Documentos a la Izquierda | Visor PDF a la Derecha -->
          <div class="split-layout">
            <div class="split-main">
              <!-- Información de Cierre de Cobertura -->
              <div class="novedad-alert con-novedad" style="margin-bottom: 1rem; border-left: 4px solid #dc2626; background: #fff5f5;">
                <h4 style="margin: 0 0 0.35rem 0; color: #991b1b;">Motivo de Egreso de Lista de Pago:</h4>
                <div>
                  El hijo(a) causante <strong>{{ selFin.nombreMenor }}</strong> (RUT: <span class="mono-badge">{{ selFin.rutMenor || 'S/R' }}</span>) nació el <strong>{{ (selFin.fechaNacimientoMenor | date:'dd/MM/yyyy') || '15/03/2024' }}</strong> y cumplió los 2 años de edad el día <strong style="color: #dc2626;">{{ (calcularFechaCumple2Anos(selFin.fechaNacimientoMenor) | date:'dd/MM/yyyy') || '15/03/2026' }}</strong>.
                </div>
                <div *ngIf="selFin.observacionesCoordinador || selFin.motivoRechazoCorrecciones" style="margin-top: 0.5rem; font-weight: 600; color: #881337;">
                  📝 Observaciones registradas: {{ selFin.observacionesCoordinador || selFin.motivoRechazoCorrecciones }}
                </div>
              </div>

              <!-- Documentación Histórica Aprobada -->
              <h3 style="margin-top: 1rem;">Documentación Inicial del Expediente</h3>
              <div class="table-responsive" *ngIf="selFin.documentosIniciales && selFin.documentosIniciales.length > 0">
                <table class="data-table" style="font-size: 0.85rem;">
                  <thead>
                    <tr>
                      <th>Tipo Documento</th>
                      <th>Nombre Archivo</th>
                      <th>Fecha Subida</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let doc of selFin.documentosIniciales">
                      <td><strong>{{ doc.tipoDocumento }}</strong></td>
                      <td>{{ doc.nombreArchivo }}</td>
                      <td>{{ doc.fechaSubida | date:'dd/MM/yyyy HH:mm' }}</td>
                      <td><span class="slot-badge ok">APROBADO</span></td>
                      <td>
                        <div style="display: flex; gap: 0.35rem;">
                          <button
                            type="button"
                            class="btn btn-sm btn-primary"
                            (click)="verPdfEnPagina(doc.documentoID, doc.tipoDocumento + ' - ' + doc.nombreArchivo)"
                          >
                            👁 Ver en Visor
                          </button>
                          <a
                            [href]="obtenerUrlDescarga(doc.documentoID)"
                            target="_blank"
                            download
                            class="btn btn-sm btn-outline"
                          >
                            ⬇
                          </a>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Columna Derecha: Visor PDF -->
            <div class="split-side">
              <div class="folder-viewer-card" style="position: sticky; top: 1rem;">
                <div class="folder-header">
                  <div>
                    <span class="badge-institucional">VISOR DOCUMENTAL EN PÁGINA</span>
                    <h3 style="margin-top: 0.25rem;">
                      {{ pdfEnPaginaTitulo || 'Seleccione un documento para visualizarlo' }}
                    </h3>
                  </div>
                  <div style="display: flex; gap: 0.45rem;" *ngIf="pdfEnPaginaRawUrl">
                    <a
                      [href]="pdfEnPaginaDescargaUrl"
                      target="_blank"
                      download
                      class="btn btn-sm btn-outline"
                    >
                      ⬇ Descargar
                    </a>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline"
                      (click)="cerrarVisorPdf()"
                    >
                      ✕ Cerrar
                    </button>
                  </div>
                </div>

                <div *ngIf="!pdfEnPaginaUrl" class="empty-state" style="padding: 3rem 1rem;">
                  <p>Haga clic en <strong>"👁 Ver en Visor"</strong> en cualquiera de los documentos para examinarlo en este visor.</p>
                </div>

                <div *ngIf="pdfEnPaginaUrl" style="height: 540px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
                  <iframe
                    [src]="pdfEnPaginaUrl"
                    style="width: 100%; height: 100%; border: none;"
                    title="Visor PDF Coordinador Derechos Finalizados"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VistaCoordinadorComponent implements OnInit {
  private readonly solicitudService = inject(SolicitudService);
  private readonly documentoService = inject(DocumentoService);
  private readonly controlMensualService = inject(ControlMensualService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly authService = inject(AuthService);
  readonly simuladorFecha = inject(SimuladorFechaService);

  readonly meses = MESES_CATALOGO;
  readonly regionesChile = REGIONES_CHILE;

  vistaActiva: 'postulantes' | 'lista-pago' | 'derechos-finalizados' = 'postulantes';
  filtroRegion = '';

  postulacionesPendientes: SolicitudDto[] = [];
  beneficiariasEnListaPago: SolicitudDto[] = [];
  controlesMensualesListaPago: ControlMensualDto[] = [];

  postulacionSeleccionada: SolicitudDto | null = null;
  evaluacionesForm: EvaluacionDocFormulario[] = [];
  observacionGeneralCoordinador = '';

  formResolucion = {
    numeroResolucion: '',
    fechaResolucion: this.simuladorFecha.fechaFormatoIsoDate,
    montoMensualAprobado: 385000
  };

  pdfEnPaginaUrl: SafeResourceUrl | null = null;
  pdfEnPaginaRawUrl = '';
  pdfEnPaginaDescargaUrl = '';
  pdfEnPaginaTitulo = '';
  guardandoResolucion = false;

  // Beneficiaria seleccionada en la pestaña 'Lista de Pago Activa'
  beneficiariaSeleccionada: SolicitudDto | null = null;

  // Beneficiaria seleccionada en la pestaña 'Derechos Finalizados'
  beneficiariaFinalizadaSeleccionada: SolicitudDto | null = null;

  formConfirmacionDia30 = {
    anio: this.simuladorFecha.anio,
    mes: this.simuladorFecha.mes,
    confirmaTrabajo30Dias: true,
    diasFeriadoLegal: 0,
    diasAdministrativos: 0,
    diasLicenciaMedica: 0,
    observaciones: ''
  };
  archivoRespaldoCoordinador: File | null = null;
  guardandoConfirmacionDia30 = false;

  // =========================================================================
  // CONTROL DE EDAD DEL MENOR CAUSANTE (LÍMITE LEGAL 2 AÑOS - O.G. N° 2551)
  // =========================================================================

  calcularFechaCumple2Anos(fechaNacStr?: string | null): Date | null {
    // Si no viene fecha, asumimos por defecto la de Mateo Soto (15/03/2024) para el ejercicio
    const str = fechaNacStr || '2024-03-15';
    const fn = new Date(str);
    if (isNaN(fn.getTime())) return null;
    return new Date(fn.getFullYear() + 2, fn.getMonth(), fn.getDate(), 23, 59, 59);
  }

  esDerechoFinalizado(sol: SolicitudDto): boolean {
    const limite = this.calcularFechaCumple2Anos(sol.fechaNacimientoMenor);
    if (!limite) return false;
    return this.simuladorFecha.fechaActual >= limite;
  }

  calcularEdadDetalle(fechaNacStr?: string | null): string {
    const str = fechaNacStr || '2024-03-15';
    const fn = new Date(str);
    if (isNaN(fn.getTime())) return 'Fecha inválida';
    const ref = this.simuladorFecha.fechaActual;

    let anios = ref.getFullYear() - fn.getFullYear();
    let meses = ref.getMonth() - fn.getMonth();
    let dias = ref.getDate() - fn.getDate();

    if (dias < 0) {
      meses--;
    }
    if (meses < 0) {
      anios--;
      meses += 12;
    }

    if (anios >= 2) {
      return '2 años cumplidos (Finalizado)';
    }
    if (anios === 1) {
      return `1 año y ${meses} mes(es)`;
    }
    return `${meses} mes(es)`;
  }

  get beneficiariasEnListaPagoVigentes(): SolicitudDto[] {
    return this.beneficiariasEnListaPago.filter(b => !this.esDerechoFinalizado(b));
  }

  get beneficiariasDerechoFinalizado(): SolicitudDto[] {
    return this.beneficiariasEnListaPago.filter(b => this.esDerechoFinalizado(b));
  }

  seleccionarBeneficiariaFinalizada(ben: SolicitudDto): void {
    this.beneficiariaFinalizadaSeleccionada = ben;
    this.cerrarVisorPdf();
  }

  cerrarDetalleBeneficiariaFinalizada(): void {
    this.beneficiariaFinalizadaSeleccionada = null;
    this.cerrarVisorPdf();
  }

  ngOnInit(): void {
    // Mantener sincronizado el formulario con el calendario emulador
    this.simuladorFecha.fecha$.subscribe(() => {
      this.formConfirmacionDia30.anio = this.simuladorFecha.anio;
      this.formConfirmacionDia30.mes = this.simuladorFecha.mes;
      if (this.beneficiariaSeleccionada) {
        this.sincronizarDeclaracionBeneficiaria(this.beneficiariaSeleccionada.solicitudID);
      }
    });

    this.cargarDatosCoordinador();
  }

  cambiarVista(vista: 'postulantes' | 'lista-pago' | 'derechos-finalizados'): void {
    this.vistaActiva = vista;
    this.cargarDatosCoordinador();
  }

  cargarDatosCoordinador(): void {
    const regFiltro = this.authService.esRegionMetropolitana
      ? (this.filtroRegion || undefined)
      : this.authService.codigoRegionActual;

    this.solicitudService.listarSolicitudes(undefined, undefined, regFiltro).subscribe({
      next: (todas) => {
        this.postulacionesPendientes = todas.filter(s => !s.enListaPagoActiva);
        this.beneficiariasEnListaPago = todas.filter(s => s.enListaPagoActiva);

        if (this.postulacionSeleccionada) {
          const actualizada = todas.find(
            s => s.solicitudID === this.postulacionSeleccionada?.solicitudID
          );
          if (actualizada && !actualizada.enListaPagoActiva) {
            this.seleccionarPostulante(actualizada);
          } else {
            this.cerrarSeleccionPostulante();
          }
        }
      }
    });

    this.controlMensualService.listarControles({ codigoRegion: regFiltro }).subscribe({
      next: (controles) => {
        this.controlesMensualesListaPago = controles;
      }
    });
  }

  seleccionarPostulante(sol: SolicitudDto): void {
    this.postulacionSeleccionada = sol;
    this.observacionGeneralCoordinador = sol.observacionesCoordinador || '';
    this.formResolucion = {
      numeroResolucion: `RES-BIENESTAR-2026-00${sol.solicitudID}`,
      fechaResolucion: this.simuladorFecha.fechaFormatoIsoDate,
      montoMensualAprobado: sol.montoMensualBase || 385000
    };

    this.evaluacionesForm = (sol.documentosIniciales || []).map((d: DocumentoInicialDto) => ({
      documentoID: d.documentoID,
      tipoDocumento: d.tipoDocumento,
      nombreArchivo: d.nombreArchivo,
      fechaSubida: d.fechaSubida,
      aprobado: d.estadoDocumento !== 'Observado',
      observacion: d.observacionDocumento || ''
    }));

    // NO forzar carga automática de documento al seleccionar; el usuario elige cuál ver o descargar
    this.pdfEnPaginaUrl = null;
    this.pdfEnPaginaRawUrl = '';
    this.pdfEnPaginaDescargaUrl = '';
    this.pdfEnPaginaTitulo = '';
  }

  cerrarSeleccionPostulante(): void {
    this.postulacionSeleccionada = null;
    this.evaluacionesForm = [];
    this.cerrarVisorPdf();
  }

  cerrarVisorPdf(): void {
    this.pdfEnPaginaUrl = null;
    this.pdfEnPaginaRawUrl = '';
    this.pdfEnPaginaDescargaUrl = '';
    this.pdfEnPaginaTitulo = '';
  }

  obtenerUrlDescarga(documentoId: number): string {
    return this.documentoService.obtenerUrlDescarga(documentoId);
  }

  verPdfEnPagina(documentoId: number, titulo: string): void {
    const urlVisualizacion = this.documentoService.obtenerUrlVisualizacion(documentoId);
    this.pdfEnPaginaRawUrl = urlVisualizacion;
    this.pdfEnPaginaDescargaUrl = this.documentoService.obtenerUrlDescarga(documentoId);
    this.pdfEnPaginaTitulo = titulo;
    this.pdfEnPaginaUrl = this.sanitizer.bypassSecurityTrustResourceUrl(urlVisualizacion);
  }

  alCambiarCheckAprobado(item: EvaluacionDocFormulario, checked: boolean): void {
    item.aprobado = checked;
    if (checked) {
      item.observacion = '';
    }
  }

  todosLosDocumentosMarcadosAprobados(): boolean {
    return (
      this.evaluacionesForm.length > 0 &&
      this.evaluacionesForm.every(item => item.aprobado)
    );
  }

  guardarRevisionDocumentos(): void {
    if (!this.postulacionSeleccionada) return;

    // Validar que si algún documento no está aprobado, tenga su observación escrita
    for (const item of this.evaluacionesForm) {
      if (!item.aprobado && !item.observacion.trim()) {
        this.notificacionService.alerta(
          `Debe ingresar la observación para el documento no aprobado: "${item.tipoDocumento}".`
        );
        return;
      }
    }

    const evaluacionesPayload: EvaluacionDocumentoItemDto[] = this.evaluacionesForm.map(item => ({
      documentoID: item.documentoID,
      aprobado: item.aprobado,
      observacion: item.aprobado ? null : item.observacion.trim()
    }));

    const todosAprobados = this.todosLosDocumentosMarcadosAprobados();

    this.solicitudService
      .revisarDocumentacion(this.postulacionSeleccionada.solicitudID, {
        aprobarDocumentacion: todosAprobados,
        observacionesCoordinador: this.observacionGeneralCoordinador.trim() || null,
        usuarioResponsable: this.notificacionService.usuarioActual,
        evaluacionesDocumentos: evaluacionesPayload
      })
      .subscribe({
        next: (actualizada) => {
          this.postulacionSeleccionada = actualizada;
          this.notificacionService.exito(
            todosAprobados
              ? `Todos los documentos fueron aprobados. La postulación #${actualizada.solicitudID} quedó a la espera del Número de Resolución.`
              : `Se registraron las observaciones de los documentos no aprobados en la postulación #${actualizada.solicitudID}.`
          );
          this.cargarDatosCoordinador();
        }
      });
  }

  asociarResolucionEIngresarAListaPago(sol: SolicitudDto): void {
    if (this.guardandoResolucion) return;

    if (!this.formResolucion.numeroResolucion.trim()) {
      this.notificacionService.alerta('Ingrese el Número de Resolución para incorporar a la Lista de Pago.');
      return;
    }

    this.guardandoResolucion = true;
    this.solicitudService
      .emitirResolucion(sol.solicitudID, {
        numeroResolucion: this.formResolucion.numeroResolucion.trim(),
        fechaResolucion: this.formResolucion.fechaResolucion,
        montoMensualAprobado: this.formResolucion.montoMensualAprobado,
        coordinadorEmisor: this.notificacionService.usuarioActual,
        observaciones: 'Documentación aprobada e incorporada a Lista de Pago Activa.'
      })
      .subscribe({
        next: () => {
          this.guardandoResolucion = false;
          this.notificacionService.exito(
            `Resolución N° ${this.formResolucion.numeroResolucion} registrada. ${sol.funcionarioNombreCompleto} ingresó a la Lista de Pago Activa.`
          );
          this.cerrarSeleccionPostulante();
          this.vistaActiva = 'lista-pago';
          this.cargarDatosCoordinador();
        },
        error: () => {
          this.guardandoResolucion = false;
        }
      });
  }

  seleccionarBeneficiariaListaPago(ben: SolicitudDto): void {
    this.beneficiariaSeleccionada = ben;
    this.archivoRespaldoCoordinador = null;
    this.cerrarVisorPdf();
    this.sincronizarDeclaracionBeneficiaria(ben.solicitudID);
  }

  cerrarDetalleBeneficiaria(): void {
    this.beneficiariaSeleccionada = null;
    this.archivoRespaldoCoordinador = null;
    this.cerrarVisorPdf();
  }

  obtenerControlPeriodoActual(solicitudId: number): ControlMensualDto | undefined {
    return this.controlesMensualesListaPago.find(
      c => c.solicitudID === solicitudId &&
           c.anio === this.formConfirmacionDia30.anio &&
           c.mes === this.formConfirmacionDia30.mes
    );
  }

  obtenerEstadoPeriodoBeneficiaria(solicitudId: number): string {
    const c = this.obtenerControlPeriodoActual(solicitudId);
    if (!c) {
      return 'Pendiente Declaración Día 30';
    }
    if (c.estadoFlujo === 'Visto Bueno Coordinador') {
      return 'Derivado a Visador (Visto Bueno Conforme)';
    }
    if (c.estadoFlujo === 'Visado Conforme') {
      return 'En Logística (Visado Conforme)';
    }
    if (c.estadoFlujo === 'Compromiso Logistica') {
      return 'En Finanzas / DECOFI (Compromiso Generado)';
    }
    if (c.estadoFlujo === 'Pagado Finanzas' || c.estadoFlujo === 'Pagado Tesoreria') {
      return 'Pagado Definitivo';
    }
    if (c.estadoFlujo === 'Devuelto a Coordinador') {
      return 'Devuelto por Visador (Requiere Corrección)';
    }
    if (c.estadoFlujo === 'Notificado Dia 30') {
      return 'Declarado por Funcionaria (Pendiente Visto Bueno)';
    }
    return c.estadoFlujo;
  }

  obtenerClaseBadgePeriodo(solicitudId: number): string {
    const c = this.obtenerControlPeriodoActual(solicitudId);
    if (!c) return 'badge-pendiente';
    if (
      c.estadoFlujo === 'Visto Bueno Coordinador' ||
      c.estadoFlujo === 'Visado Conforme' ||
      c.estadoFlujo === 'Compromiso Logistica' ||
      c.estadoFlujo.includes('Pagado')
    ) {
      return 'badge-aprobada';
    }
    if (c.estadoFlujo === 'Devuelto a Coordinador' || c.estadoFlujo === 'Beneficio Cancelado') {
      return 'badge-rechazada';
    }
    return 'badge-pendiente';
  }

  sincronizarDeclaracionBeneficiaria(solicitudId: number): void {
    const cBen = this.obtenerControlPeriodoActual(solicitudId);
    if (cBen) {
      this.formConfirmacionDia30.confirmaTrabajo30Dias = !cBen.tuvoCausalDescuento;
      this.formConfirmacionDia30.diasFeriadoLegal = cBen.diasFeriadoLegal;
      this.formConfirmacionDia30.diasAdministrativos = cBen.diasAdministrativos;
      this.formConfirmacionDia30.diasLicenciaMedica = cBen.diasLicenciaMedica;
    } else {
      this.formConfirmacionDia30.confirmaTrabajo30Dias = true;
      this.formConfirmacionDia30.diasFeriadoLegal = 0;
      this.formConfirmacionDia30.diasAdministrativos = 0;
      this.formConfirmacionDia30.diasLicenciaMedica = 0;
    }
  }

  alCambiarConfirmaTrabajo(confirma: boolean): void {
    if (confirma) {
      this.formConfirmacionDia30.diasFeriadoLegal = 0;
      this.formConfirmacionDia30.diasAdministrativos = 0;
      this.formConfirmacionDia30.diasLicenciaMedica = 0;
    }
  }

  calcularDiasEfectivosCoordinador(): number {
    if (this.formConfirmacionDia30.confirmaTrabajo30Dias) return 30;
    const faltas =
      (this.formConfirmacionDia30.diasFeriadoLegal || 0) +
      (this.formConfirmacionDia30.diasAdministrativos || 0) +
      (this.formConfirmacionDia30.diasLicenciaMedica || 0);
    return Math.max(0, 30 - faltas);
  }

  calcularDiasFaltantesCoordinador(): number {
    return 30 - this.calcularDiasEfectivosCoordinador();
  }

  calcularMontoProporcionalCoordinador(): number {
    const base =
      this.beneficiariaSeleccionada?.resolucion?.montoMensualAprobado ||
      this.beneficiariaSeleccionada?.montoMensualBase ||
      385000;
    return Math.round((base / 30) * this.calcularDiasEfectivosCoordinador());
  }

  alSeleccionarArchivoRespaldoCoordinador(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivoRespaldoCoordinador =
      input.files && input.files.length > 0 ? input.files[0] : null;
  }

  verPdfRespaldoEnPagina(controlId: number, titulo: string): void {
    const urlVisualizacion = this.controlMensualService.obtenerUrlVisualizacion(controlId);
    this.pdfEnPaginaRawUrl = urlVisualizacion;
    this.pdfEnPaginaDescargaUrl = this.controlMensualService.obtenerUrlArchivoRespaldo(controlId);
    this.pdfEnPaginaTitulo = titulo;
    this.pdfEnPaginaUrl = this.sanitizer.bypassSecurityTrustResourceUrl(urlVisualizacion);
  }

  obtenerUrlDescargaRespaldo(controlId: number): string {
    return this.controlMensualService.obtenerUrlArchivoRespaldo(controlId);
  }

  confirmarYDarVistoBuenoCoordinador(ben: SolicitudDto): void {
    if (this.guardandoConfirmacionDia30) return;

    if (!this.formConfirmacionDia30.confirmaTrabajo30Dias) {
      const faltas =
        (this.formConfirmacionDia30.diasFeriadoLegal || 0) +
        (this.formConfirmacionDia30.diasAdministrativos || 0) +
        (this.formConfirmacionDia30.diasLicenciaMedica || 0);

      if (faltas <= 0) {
        this.notificacionService.alerta('Al indicar que no trabajó completo, debe ingresar al menos 1 día en Feriado Legal, Días Administrativos o Licencia Médica.');
        return;
      }
      if (faltas > 30) {
        this.notificacionService.alerta('La suma de días que faltó no puede exceder la base de 30 días.');
        return;
      }
    }

    this.guardandoConfirmacionDia30 = true;

    // 1. Registrar o actualizar la declaración oficial con los días confirmados y archivo de respaldo
    this.controlMensualService
      .registrarDeclaracionDia30({
        solicitudID: ben.solicitudID,
        anio: this.formConfirmacionDia30.anio,
        mes: this.formConfirmacionDia30.mes,
        tuvoCausalDescuento: !this.formConfirmacionDia30.confirmaTrabajo30Dias,
        diasFeriadoLegal: this.formConfirmacionDia30.confirmaTrabajo30Dias ? 0 : this.formConfirmacionDia30.diasFeriadoLegal,
        diasAdministrativos: this.formConfirmacionDia30.confirmaTrabajo30Dias ? 0 : this.formConfirmacionDia30.diasAdministrativos,
        diasLicenciaMedica: this.formConfirmacionDia30.confirmaTrabajo30Dias ? 0 : this.formConfirmacionDia30.diasLicenciaMedica,
        archivoRespaldo: this.archivoRespaldoCoordinador,
        usuarioResponsable: this.notificacionService.usuarioActual
      })
      .subscribe({
        next: (controlRegistrado) => {
          // 2. Otorgar inmediatamente el Visto Bueno Institucional del Coordinador para derivar al Visador
          this.controlMensualService
            .avanzarEtapaCircuito(controlRegistrado.controlID, {
              rolAccion: 'COORDINADOR',
              accion: 'VISTO_BUENO',
              nombreResponsable: this.notificacionService.usuarioActual,
              observaciones: this.formConfirmacionDia30.observaciones.trim() ||
                `Visto Bueno del Coordinador otorgado. Días efectivos validados: ${controlRegistrado.diasEfectivos}/30.`
            })
            .subscribe({
              next: () => {
                this.guardandoConfirmacionDia30 = false;
                this.notificacionService.exito(
                  `Situación del Día 30 confirmada y visada conforme para ${ben.funcionarioNombreCompleto}. Expediente #${controlRegistrado.controlID} derivado a Visador.`
                );
                this.cargarDatosCoordinador();
              },
              error: () => {
                this.guardandoConfirmacionDia30 = false;
                this.cargarDatosCoordinador();
              }
            });
        },
        error: () => {
          this.guardandoConfirmacionDia30 = false;
        }
      });
  }

  darVistoBuenoCoordinador(c: ControlMensualDto): void {
    this.controlMensualService
      .avanzarEtapaCircuito(c.controlID, {
        rolAccion: 'COORDINADOR',
        accion: 'VISTO_BUENO',
        nombreResponsable: this.notificacionService.usuarioActual,
        observaciones: 'Visto bueno definitivo del Coordinador. Avanza a Visador.'
      })
      .subscribe({
        next: () => {
          this.notificacionService.exito(
            `Visto Bueno otorgado al expediente #${c.controlID}. Enviado a Visador.`
          );
          this.cargarDatosCoordinador();
        }
      });
  }

  cancelarBeneficioCoordinador(c: ControlMensualDto): void {
    this.controlMensualService
      .avanzarEtapaCircuito(c.controlID, {
        rolAccion: 'COORDINADOR',
        accion: 'CANCELAR_BENEFICIO',
        nombreResponsable: this.notificacionService.usuarioActual,
        observaciones: 'Beneficio cancelado por Coordinador.'
      })
      .subscribe({
        next: () => {
          this.notificacionService.alerta(`Beneficio cancelado en expediente #${c.controlID}.`);
          this.cargarDatosCoordinador();
        }
      });
  }

  obtenerNombreMes(mes: number): string {
    return this.meses.find(m => m.numero === mes)?.nombre || `Mes ${mes}`;
  }

  obtenerClaseEstadoSolicitud(estado: string): string {
    if (estado === 'En Lista de Pago Activa' || estado === 'En Espera Resolucion') return 'badge-aprobada';
    if (estado === 'Rechazada por Coordinador' || estado === 'Beneficio Cancelado') return 'badge-rechazada';
    return 'badge-pendiente';
  }

  obtenerClaseEstadoFlujo(estado: string): string {
    if (
      estado === 'Pagado Tesoreria' ||
      estado === 'Pagado Finanzas' ||
      estado === 'Visado Conforme' ||
      estado === 'Compromiso Logistica'
    ) {
      return 'badge-aprobada';
    }
    if (estado === 'Devuelto a Coordinador' || estado === 'Beneficio Cancelado') {
      return 'badge-rechazada';
    }
    return 'badge-pendiente';
  }
}
