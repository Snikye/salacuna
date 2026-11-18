import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  CatalogoDocumentoInicial,
  ControlMensualDto,
  DocumentoInicialDto,
  FuncionarioDto,
  MESES_CATALOGO,
  REGIONES_CHILE,
  SincronizarFuncionarioRequest,
  SolicitudDto,
  TIPOS_DOCUMENTOS_INICIALES
} from '../../core/models/sala-cuna.models';
import { AuthService } from '../../core/services/auth.service';
import { FuncionarioService } from '../../core/services/funcionario.service';
import { SolicitudService } from '../../core/services/solicitud.service';
import { DocumentoService } from '../../core/services/documento.service';
import { ControlMensualService } from '../../core/services/control-mensual.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { SimuladorFechaService } from '../../core/services/simulador-fecha.service';

@Component({
  selector: 'app-vista-postulante',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Encabezado Exclusivo del Usuario Postulante / Beneficiaria -->
      <div class="section-header">
        <div>
          <span class="badge-institucional" style="background-color: #0f766e; color: #ffffff;">
            PORTAL DE LA FUNCIONARIA POSTULANTE / BENEFICIARIA PDI
          </span>
          <h1>Mi Postulación al Bono Compensatorio y Declaración Mensual (Día 30)</h1>
          <p class="subtitle">
            <strong>Etapa 1 (Postulación):</strong> Adjunte los documentos requeridos para revisión del Coordinador y consulte su Número de Resolución cuando ingrese a la Lista de Pago Activa.<br />
            <strong>Etapa 2 (Día 30 de cada mes):</strong> Declare obligatoriamente si hizo uso (<strong>SÍ / NO</strong>) de <strong>Feriado Legal</strong>, <strong>Días Administrativos</strong> o <strong>Licencia Médica</strong>.
          </p>
        </div>
      </div>

      <!-- 1. MIS DATOS INSTITUCIONALES Y DEL MENOR CAUSANTE -->
      <div class="card" *ngIf="funcionarioActual">
        <div class="card-header-flex">
          <h2>1. Mis Datos Institucionales PDI y del Menor Causante</h2>
          <button class="btn btn-outline btn-sm" (click)="mostrarEdicionFicha = !mostrarEdicionFicha">
            {{ mostrarEdicionFicha ? 'Ocultar Edición' : 'Actualizar Teléfono / Región / Datos del Menor' }}
          </button>
        </div>

        <div class="funcionario-summary">
          <div class="summary-item">
            <span class="label">Funcionaria:</span>
            <strong>{{ funcionarioActual.nombreCompleto }}</strong>
          </div>
          <div class="summary-item">
            <span class="label">RUT:</span>
            <span class="mono-badge">{{ funcionarioActual.rut }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Región Policial:</span>
            <span class="side-badge">{{ funcionarioActual.codigoRegion }} — {{ funcionarioActual.nombreRegion }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Teléfono / N° SIDE:</span>
            <strong>{{ funcionarioActual.telefono || 'S/T' }} | SIDE: {{ funcionarioActual.numeroSide || 'S/N' }}</strong>
          </div>
          <div class="summary-item">
            <span class="label">Menor Causante:</span>
            <strong>
              {{ funcionarioActual.nombreMenor || 'Por completar' }} ({{ funcionarioActual.rutMenor || 'S/R' }})
              <span *ngIf="funcionarioActual.fechaNacimientoMenor">
                — Nac: {{ funcionarioActual.fechaNacimientoMenor | date:'dd/MM/yyyy' }}
              </span>
            </strong>
          </div>
        </div>

        <div class="sync-panel" *ngIf="mostrarEdicionFicha">
          <h3>Actualizar Ficha Personal y del Menor</h3>
          <div class="grid-form">
            <div class="form-group">
              <label>Nombres *</label>
              <input type="text" class="input-control" [(ngModel)]="formFicha.nombres" />
            </div>
            <div class="form-group">
              <label>Apellidos *</label>
              <input type="text" class="input-control" [(ngModel)]="formFicha.apellidos" />
            </div>
            <div class="form-group">
              <label>Región PDI *</label>
              <select class="input-control" [(ngModel)]="formFicha.codigoRegion" (change)="alCambiarRegion()">
                <option *ngFor="let r of regionesChile" [value]="r.codigo">{{ r.nombre }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Teléfono *</label>
              <input type="text" class="input-control" [(ngModel)]="formFicha.telefono" />
            </div>
            <div class="form-group">
              <label>Número de SIDE *</label>
              <input type="text" class="input-control" [(ngModel)]="formFicha.numeroSide" />
            </div>
            <div class="form-group">
              <label>Unidad Policial</label>
              <input type="text" class="input-control" [(ngModel)]="formFicha.unidad" />
            </div>
            <div class="form-group">
              <label>Nombre del Menor (Lactante)</label>
              <input type="text" class="input-control" [(ngModel)]="formFicha.nombreMenor" />
            </div>
            <div class="form-group">
              <label>RUT del Menor</label>
              <input type="text" class="input-control" [(ngModel)]="formFicha.rutMenor" />
            </div>
            <div class="form-group">
              <label>Fecha de Nacimiento del Menor (Lactante)</label>
              <input type="date" class="input-control" [(ngModel)]="formFicha.fechaNacimientoMenor" />
            </div>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" (click)="guardarFichaPersonal()">Guardar Mis Datos</button>
          </div>
        </div>
      </div>

      <!-- 2. MÓDULO 1: MI POSTULACIÓN Y CARGA DE X DOCUMENTOS REQUERIDOS -->
      <div class="card" *ngIf="funcionarioActual">
        <div class="card-header-flex">
          <div>
            <h2>2. Mi Postulación y Documentación Requerida (Etapa 1)</h2>
            <p class="text-muted">
              Adjunte los archivos PDF requeridos. Si el Coordinador observa algún documento, verá aquí el motivo detallado para reemplazar el archivo corregido.
            </p>
          </div>
          <button
            *ngIf="!solicitudActiva"
            class="btn btn-primary"
            (click)="iniciarPostulacion()"
          >
            + Crear Mi Postulación al Bono Compensatorio
          </button>
        </div>

        <div *ngIf="solicitudActiva" class="status-banner">
          <div class="status-main">
            <span class="status-title">Postulación #{{ solicitudActiva.solicitudID }}</span>
            <span class="badge-estado" [ngClass]="obtenerClaseEstadoSolicitud(solicitudActiva.estado)">
              {{ (esDerechoFinalizadoPostulante() ? 'DERECHO FINALIZADO (2 AÑOS)' : solicitudActiva.estado) | uppercase }}
            </span>
            <span class="status-date">
              Documentos Cargados: <strong>{{ solicitudActiva.cantidadDocumentosSubidos }} / {{ solicitudActiva.cantidadDocumentosRequeridos }} PDFs</strong>
            </span>
            <span class="side-badge" *ngIf="solicitudActiva.enListaPagoActiva && !esDerechoFinalizadoPostulante()">
              ✓ BENEFICIO ACTIVO EN LISTA DE PAGO — Resolución N° {{ solicitudActiva.resolucion?.numeroResolucion }} (&#36;{{ solicitudActiva.resolucion?.montoMensualAprobado | number:'1.0-0' }}/mes)
            </span>
            <span class="side-badge" *ngIf="esDerechoFinalizadoPostulante()" style="background: #fee2e2; color: #991b1b; border: 1px solid #f87171;">
              🛑 BENEFICIO EGRESADO POR LÍMITE DE EDAD (2 AÑOS CUMPLIDOS)
            </span>
          </div>
        </div>

        <!-- AVISO INSTITUCIONAL DE FINALIZACIÓN DE DERECHO (LÍMITE LEGAL 2 AÑOS) -->
        <!-- Solo aplica si la funcionaria tenía su beneficio activo en Lista de Pago y el menor cumplió los 2 años -->
        <div
          class="novedad-alert con-novedad"
          *ngIf="solicitudActiva && solicitudActiva.enListaPagoActiva && esDerechoFinalizadoPostulante()"
          style="margin-bottom: 1.25rem; border: 2px solid #ef4444; background: #fef2f2; color: #991b1b; padding: 1.25rem; border-radius: 8px;"
        >
          <div style="display: flex; gap: 0.85rem; align-items: flex-start;">
            <span style="font-size: 2rem; line-height: 1;">🔴</span>
            <div style="flex: 1;">
              <h3 style="margin: 0 0 0.35rem 0; color: #991b1b; font-size: 1.15rem; font-weight: 700;">
                AVISO INSTITUCIONAL: FINALIZACIÓN DEL DERECHO A SALA CUNA (LÍMITE 2 AÑOS DE EDAD)
              </h3>
              <p style="margin: 0 0 0.5rem 0; font-size: 0.9rem; line-height: 1.45;">
                Estimada funcionaria <strong>{{ funcionarioActual.nombreCompleto }}</strong>:<br />
                Le informamos formalmente que el derecho al beneficio de Sala Cuna / Bono Compensatorio para su hijo(a) <strong>{{ funcionarioActual.nombreMenor || 'Lactante causante' }}</strong> ha <strong>FINALIZADO</strong> con fecha <strong>{{ calcularFechaCumple2AnosPostulante() | date:'dd/MM/yyyy' }}</strong>, en estricto cumplimiento de lo establecido en la <strong>Orden General N° 2551 de la Jefatura de Bienestar</strong> y el <strong>Artículo 203 del Código del Trabajo</strong> (límite reglamentario de 2 años de edad).
              </p>
              <div
                *ngIf="solicitudActiva.observacionesCoordinador || solicitudActiva.motivoRechazoCorrecciones"
                style="margin: 0.5rem 0; padding: 0.5rem 0.75rem; background: #fff1f2; border-left: 4px solid #e11d48; font-size: 0.85rem; color: #881337;"
              >
                📝 <strong>Observaciones registradas en su expediente:</strong>
                {{ solicitudActiva.observacionesCoordinador || solicitudActiva.motivoRechazoCorrecciones }}
              </div>
              <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: #b91c1c; font-weight: 600;">
                ℹ Su beneficio ha egresado de la Lista de Pago Activa. Ya no debe remitir declaraciones mensuales del Día 30 para períodos posteriores a su cumplimiento.
              </p>
            </div>
          </div>
        </div>

        <!-- Alerta de Rechazo y Correcciones solicitadas por el Coordinador -->
        <div
          *ngIf="solicitudActiva && solicitudActiva.motivoRechazoCorrecciones"
          class="novedad-alert con-novedad"
          style="margin-bottom: 1rem;"
        >
          <strong>⚠ Su postulación fue observada/rechazada por el Coordinador. Motivo y correcciones requeridas:</strong>
          <div style="margin-top: 0.35rem; font-weight: 600;">{{ solicitudActiva.motivoRechazoCorrecciones }}</div>
          <small>Suba nuevamente el documento PDF corregido en el casillero correspondiente para reenviar a revisión.</small>
        </div>

        <div class="docs-grid" *ngIf="solicitudActiva">
          <div
            class="doc-slot-card"
            *ngFor="let tipo of catalogoDocumentos"
            [class.uploaded]="obtenerDocumentoPorTipo(tipo.codigo)"
          >
            <div class="doc-slot-header">
              <h4>{{ tipo.nombre }}</h4>
              <span
                class="slot-badge"
                [class.ok]="obtenerDocumentoPorTipo(tipo.codigo)"
                [class.pending]="!obtenerDocumentoPorTipo(tipo.codigo)"
              >
                {{ obtenerDocumentoPorTipo(tipo.codigo) ? (obtenerDocumentoPorTipo(tipo.codigo)?.estadoDocumento || 'Cargado') : 'Pendiente' }}
              </span>
            </div>
            <p class="doc-desc">{{ tipo.descripcion }}</p>

            <button
              *ngIf="tipo.codigo === 'Solicitud Director General'"
              type="button"
              class="btn btn-sm btn-outline"
              style="margin-bottom: 0.65rem; width: 100%; border-color: #0284c7; color: #0369a1; background: #f0f9ff; font-size: 0.8rem; font-weight: 600;"
              (click)="abrirModalFormatoSolicitud()"
            >
              📋 Ver Formato Oficial PDI (O.G. N° 2551)
            </button>

            <div class="doc-file-info" *ngIf="obtenerDocumentoPorTipo(tipo.codigo) as docSubido">
              <div class="file-meta">
                <span class="file-icon">PDF</span>
                <div class="file-details">
                  <strong>{{ docSubido.nombreArchivo }}</strong>
                  <small>{{ docSubido.fechaSubida | date:'dd/MM/yyyy HH:mm' }}</small>
                  <div
                    *ngIf="docSubido.estadoDocumento === 'Observado' && docSubido.observacionDocumento"
                    style="color: var(--danger); font-size: 0.8rem; font-weight: 600; margin-top: 0.25rem;"
                  >
                    ⚠ Observación Coordinador: {{ docSubido.observacionDocumento }}
                  </div>
                </div>
              </div>
              <div class="doc-actions" style="display: flex; gap: 0.45rem; flex-wrap: wrap;">
                <button
                  type="button"
                  class="btn btn-sm btn-primary"
                  (click)="previsualizarPdf(obtenerUrlVisualizacionDoc(docSubido.documentoID), docSubido.nombreArchivo, obtenerUrlDescargaDoc(docSubido.documentoID))"
                >
                  👁 Ver en Visor
                </button>
                <a
                  [href]="obtenerUrlDescargaDoc(docSubido.documentoID)"
                  target="_blank"
                  download
                  class="btn btn-sm btn-outline"
                  title="Descargar este archivo a su computadora"
                >
                  ⬇ Descargar
                </a>
              </div>
            </div>

            <div class="upload-box" *ngIf="!solicitudActiva.enListaPagoActiva">
              <label class="file-upload-label">
                <span>{{ obtenerDocumentoPorTipo(tipo.codigo) ? 'Reemplazar PDF' : 'Subir PDF' }}</span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  (change)="alSeleccionarPdfInicial($event, tipo.codigo)"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. MÓDULO 2: NOTIFICACIÓN OBLIGATORIA DÍA 30 (SOLO CUANDO ESTÁ EN LISTA DE PAGO ACTIVA) -->
      <div class="card" *ngIf="solicitudActiva && solicitudActiva.enListaPagoActiva">
        <div class="card-header-flex">
          <div>
            <h2>3. Declaración Mensual Obligatoria del Día 30 (Asistencia y Licencias)</h2>
            <p class="text-muted">
              Todos los <strong>30 de cada mes</strong> debe declarar si hizo uso (<strong>SÍ / NO</strong>) de <strong>Feriado Legal</strong>, <strong>Días Administrativos</strong> o <strong>Licencia Médica</strong>.
            </p>
          </div>
        </div>

        <!-- Banner reactivo con el Calendario Emulador -->
        <div
          class="novedad-alert"
          [class.sin-novedad]="simuladorFecha.esDia30"
          style="margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;"
          [style.background]="!simuladorFecha.esDia30 ? '#eff6ff' : ''"
          [style.borderColor]="!simuladorFecha.esDia30 ? '#38bdf8' : ''"
          [style.color]="!simuladorFecha.esDia30 ? '#0f172a' : ''"
        >
          <div>
            <span *ngIf="simuladorFecha.esDia30">
              ✔ <strong>Corte Día 30 Activo:</strong> El sistema emula la fecha <strong>{{ simuladorFecha.fechaActual | date:'dd/MM/yyyy' }}</strong>. El período <strong>{{ obtenerNombreMes(formDia30.mes) }} {{ formDia30.anio }}</strong> se encuentra habilitado para envío.
            </span>
            <span *ngIf="!simuladorFecha.esDia30">
              🗓 <strong>Fecha del Sistema Emulada:</strong> {{ simuladorFecha.fechaActual | date:'dd/MM/yyyy' }}. El corte mensual se realiza los días 30.
            </span>
          </div>
          <button
            *ngIf="!simuladorFecha.esDia30"
            type="button"
            class="btn btn-sm btn-primary"
            (click)="simuladorFecha.irADia30MesActual()"
          >
            ⚡ Situar en Día 30 de Este Mes
          </button>
        </div>

        <div class="carpeta-vida-form">
          <div class="grid-form">
            <div class="form-group">
              <label>Año *</label>
              <input type="number" min="2020" max="2100" class="input-control" [(ngModel)]="formDia30.anio" />
            </div>
            <div class="form-group">
              <label>Mes (Corte Día 30) *</label>
              <select class="input-control" [(ngModel)]="formDia30.mes">
                <option *ngFor="let m of meses" [ngValue]="m.numero">{{ m.nombre }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>¿Hizo uso de Feriado Legal, Días Administrativos o Licencia Médica? *</label>
              <select
                class="input-control"
                [(ngModel)]="formDia30.tuvoCausalDescuento"
                (ngModelChange)="alCambiarTuvoCausal($event)"
              >
                <option [ngValue]="false">NO — Continúa por los 30 días completos</option>
                <option [ngValue]="true">SÍ — Indicar cantidad de días utilizados</option>
              </select>
            </div>
          </div>

          <div class="grid-form" *ngIf="formDia30.tuvoCausalDescuento" style="margin-top: 0.75rem;">
            <div class="form-group">
              <label>Días de Feriado Legal ($\ge 0$)</label>
              <input
                type="number"
                min="0"
                max="30"
                class="input-control"
                [(ngModel)]="formDia30.diasFeriadoLegal"
              />
            </div>
            <div class="form-group">
              <label>Días Administrativos ($\ge 0$)</label>
              <input
                type="number"
                min="0"
                max="30"
                class="input-control"
                [(ngModel)]="formDia30.diasAdministrativos"
              />
            </div>
            <div class="form-group">
              <label>Días de Licencia Médica ($\ge 0$)</label>
              <input
                type="number"
                min="0"
                max="30"
                class="input-control"
                [(ngModel)]="formDia30.diasLicenciaMedica"
              />
            </div>
          </div>

          <div
            class="novedad-alert"
            [class.con-novedad]="formDia30.tuvoCausalDescuento"
            [class.sin-novedad]="!formDia30.tuvoCausalDescuento"
            style="margin-top: 0.9rem;"
          >
            <strong>Cálculo Proporcional Estimado (Base 30 Días):</strong>
            Días Efectivos: <strong>{{ calcularDiasEfectivosPreview() }} / 30 días</strong> —
            Monto Proporcional: <strong>&#36;{{ calcularMontoProporcionalPreview() | number:'1.0-0' }}</strong>
          </div>

          <div class="form-group" style="margin-top: 0.85rem;">
            <label>Adjuntar Respaldo en PDF (Opcional si declaró NO; recomendado si declaró SÍ)</label>
            <input
              type="file"
              accept=".pdf,application/pdf"
              class="input-control"
              (change)="alSeleccionarPdfDia30($event)"
            />
          </div>

          <div class="form-actions">
            <button
              class="btn btn-primary"
              [disabled]="esDerechoFinalizadoPostulante()"
              (click)="enviarDeclaracionDia30()"
            >
              {{
                esDerechoFinalizadoPostulante()
                  ? '🛑 Beneficio Finalizado por Límite de Edad (2 Años) — Declaración Inhabilitada'
                  : '✓ Enviar Mi Declaración del Día 30 al Coordinador'
              }}
            </button>
          </div>
        </div>

        <!-- Historial de Declaraciones Mensuales de la Postulante -->
        <h3 style="margin-top: 1.5rem;">Estado de Mis Declaraciones Mensuales (Día 30)</h3>
        <div class="table-responsive" *ngIf="misControlesMensuales.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Período</th>
                <th>¿Uso de Causal?</th>
                <th>Días Efectivos</th>
                <th>Monto Proporcional</th>
                <th>Respaldo PDF</th>
                <th>Estado en el Circuito</th>
                <th>Comprobante / Observaciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of misControlesMensuales">
                <td><strong>{{ obtenerNombreMes(c.mes) }} {{ c.anio }}</strong></td>
                <td>{{ c.tuvoCausalDescuento ? 'SÍ' : 'NO (30 días)' }}</td>
                <td><strong>{{ c.diasEfectivos }} / 30</strong></td>
                <td><strong>&#36;{{ c.montoProporcionalCalculado | number:'1.0-0' }}</strong></td>
                <td>
                  <div *ngIf="c.rutaArchivoRespaldo" style="display: flex; gap: 0.35rem;">
                    <button
                      type="button"
                      class="btn btn-sm btn-outline"
                      (click)="previsualizarPdf(obtenerUrlVisualizacionRespaldo(c.controlID), 'Respaldo ' + obtenerNombreMes(c.mes) + ' ' + c.anio, obtenerUrlDescargaRespaldo(c.controlID))"
                    >
                      👁 Ver
                    </button>
                    <a
                      [href]="obtenerUrlDescargaRespaldo(c.controlID)"
                      target="_blank"
                      download
                      class="btn btn-sm btn-outline"
                      title="Descargar respaldo"
                    >
                      ⬇
                    </a>
                  </div>
                  <span *ngIf="!c.rutaArchivoRespaldo" class="text-muted">Sin causal</span>
                </td>
                <td>
                  <span class="badge-estado" [ngClass]="c.estadoFlujo.includes('Pagado') ? 'badge-aprobada' : 'badge-pendiente'">
                    {{ c.estadoFlujo }}
                  </span>
                </td>
                <td>{{ c.comprobanteTesoreria || c.observacionVisador || 'En tramitación' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal Visor PDF -->
      <div class="modal-backdrop" *ngIf="pdfPreviewUrl">
        <div class="modal-pdf-container">
          <div class="modal-pdf-header">
            <h3>Documento: {{ pdfPreviewTitulo }}</h3>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <a
                *ngIf="pdfPreviewDescargaUrl"
                [href]="pdfPreviewDescargaUrl"
                target="_blank"
                download
                class="btn btn-sm btn-outline"
                style="color: #ffffff; border-color: #cbd5e1;"
                title="Descargar este archivo PDF a su equipo"
              >
                ⬇ Descargar
              </a>
              <button class="btn btn-sm btn-danger" (click)="cerrarModalPdf()">Cerrar ✕</button>
            </div>
          </div>
          <div class="modal-pdf-body">
            <iframe [src]="pdfPreviewUrl" title="Visor PDF Postulante"></iframe>
          </div>
        </div>
      </div>

      <!-- Modal Plantilla Oficial Solicitud Director General (O.G. N° 2551) -->
      <div class="modal-backdrop" *ngIf="mostrarModalFormato">
        <div class="modal-pdf-container" style="max-width: 760px;">
          <div class="modal-pdf-header" style="background: #0f766e;">
            <div>
              <span class="badge-institucional" style="background: rgba(255,255,255,0.25); color: #ffffff;">ORDEN GENERAL N° 2551 (MODIFICA O.G. N° 874)</span>
              <h3 style="margin: 0.25rem 0 0 0; color: #ffffff;">Plantilla Oficial: Solicitud dirigida al Director General</h3>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <button class="btn btn-sm btn-outline" style="color: #ffffff; border-color: #ffffff;" (click)="copiarPlantillaSolicitud()">
                📋 Copiar Texto
              </button>
              <button class="btn btn-sm btn-danger" (click)="cerrarModalFormato()">Cerrar ✕</button>
            </div>
          </div>
          <div class="modal-pdf-body" style="padding: 1.5rem; overflow-y: auto; background: #ffffff; color: #1e293b; font-family: 'Times New Roman', Times, serif; font-size: 1.05rem; line-height: 1.6;">
            <div style="text-align: right; margin-bottom: 1.5rem;">
              <strong>Bono Compensatorio por Derecho a Sala Cuna.</strong><br />
              Santiago, {{ simuladorFecha.fechaActual | date:'dd/MM/yyyy' }}
            </div>

            <div style="margin-bottom: 1.5rem;">
              <strong>AL<br />
              SEÑOR<br />
              DIRECTOR GENERAL<br />
              POLICIA DE INVESTIGACIONES DE CHILE<br />
              <u>PRESENTE</u></strong>
            </div>

            <p style="text-align: justify; text-indent: 2rem;">
              <strong>{{ funcionarioActual?.nombreCompleto || '[Nombre y Apellidos]' }}</strong>, {{ funcionarioActual?.escalafon || '[Grado/Escalafón]' }}, R.U.N. <strong>{{ funcionarioActual?.rut || '[RUN]' }}</strong>, de dotación <strong>{{ funcionarioActual?.unidad || '[Unidad Policial]' }}</strong>, con domicilio particular [INDICAR DOMICILIO PARTICULAR], al señor Director General respetuosamente expone y solicita:
            </p>

            <p style="text-align: justify; text-indent: 2rem;">
              <strong>1.-</strong> Que, con fecha [FECHA DE INGRESO A LA INSTITUCIÓN], ingresó a la institución.
            </p>

            <p style="text-align: justify; text-indent: 2rem;">
              <strong>2.-</strong> Que, con fecha {{ (funcionarioActual?.fechaNacimientoMenor | date:'dd/MM/yyyy') || '[FECHA NACIMIENTO]' }}, nació mi hijo(a) <strong>{{ funcionarioActual?.nombreMenor || '[NOMBRE DEL MENOR]' }}</strong>, quien vive a mis expensas desde la fecha de nacimiento.
            </p>

            <p style="text-align: justify; text-indent: 2rem;">
              <strong>3.-</strong> Que, el Informe Médico que se acompaña, da cuenta la condición de salud de mi hijo(a), cuyo tratamiento o cuidado son incompatibles con la asistencia a sala de cuna, requiriendo cuidados médicos de manera permanente, lo que impide su asistencia a una sala cuna convencional.
            </p>

            <p style="text-align: justify; text-indent: 2rem;">
              <strong>4.-</strong> Que, da cumplimiento a los requisitos señalados en la <strong>Orden General N° 2551, de 04.MAY.018</strong>, que Modifica <strong>O.G N° 874 de 07.ABR.986</strong> que Aprueba Reglamento de Normas de Procedimiento para otorgamiento de Bono Compensatorio por Derecho a Sala Cuna, cuyo beneficio solo se mantendrá por el tiempo que acredite por prescripción médica la imposibilidad del hijo(a) de asistir a sala cuna y hasta los dos años de edad.
            </p>

            <div style="text-align: center; margin: 1.75rem 0 1rem 0;">
              <strong><u>POR TANTO</u></strong>
            </div>

            <p style="text-align: justify; text-indent: 2rem;">
              Viene en solicitar al señor Director General ordenar a quien corresponda se reconozca Bono Compensatorio por Derecho a Sala Cuna, a su hijo(a) <strong>{{ funcionarioActual?.nombreMenor || '[NOMBRE DEL MENOR]' }}</strong>, donde recibe atención domiciliaria en [INDICAR DIRECCIÓN DOMICILIO PARTICULAR].
            </p>

            <div style="margin-top: 3rem; text-align: center;">
              ___________________________________________<br />
              <strong>{{ funcionarioActual?.nombreCompleto || '[Firma Solicitante]' }}</strong><br />
              {{ funcionarioActual?.escalafon || 'Oficial Policial' }} — RUN {{ funcionarioActual?.rut }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VistaPostulanteComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly funcionarioService = inject(FuncionarioService);
  private readonly solicitudService = inject(SolicitudService);
  private readonly documentoService = inject(DocumentoService);
  private readonly controlMensualService = inject(ControlMensualService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly simuladorFecha = inject(SimuladorFechaService);

  readonly catalogoDocumentos: CatalogoDocumentoInicial[] = TIPOS_DOCUMENTOS_INICIALES;
  readonly meses = MESES_CATALOGO;
  readonly regionesChile = REGIONES_CHILE;

  funcionarioActual: FuncionarioDto | null = null;
  mostrarEdicionFicha = false;
  solicitudActiva: SolicitudDto | null = null;
  misControlesMensuales: ControlMensualDto[] = [];

  formFicha: SincronizarFuncionarioRequest = {
    rut: '',
    nombres: '',
    apellidos: '',
    codigoRegion: 'RM',
    nombreRegion: 'Región Metropolitana de Santiago',
    telefono: '',
    numeroSide: '',
    unidad: '',
    correoElectronico: '',
    nombreMenor: '',
    rutMenor: ''
  };

  formDia30 = {
    anio: this.simuladorFecha.anio,
    mes: this.simuladorFecha.mes,
    tuvoCausalDescuento: false,
    diasFeriadoLegal: 0,
    diasAdministrativos: 0,
    diasLicenciaMedica: 0
  };

  archivoDia30Seleccionado: File | null = null;
  pdfPreviewUrl: SafeResourceUrl | null = null;
  pdfPreviewTitulo = '';
  pdfPreviewDescargaUrl = '';
  mostrarModalFormato = false;

  // Lógica de Término de Derecho por Límite Legal de 2 Años (O.G. N° 2551)
  calcularFechaCumple2AnosPostulante(): Date | null {
    const fnStr =
      this.solicitudActiva?.fechaNacimientoMenor ||
      this.funcionarioActual?.fechaNacimientoMenor;
    if (!fnStr) return null;
    const fn = new Date(fnStr);
    if (isNaN(fn.getTime())) return null;
    return new Date(fn.getFullYear() + 2, fn.getMonth(), fn.getDate(), 23, 59, 59);
  }

  esDerechoFinalizadoPostulante(): boolean {
    // Solo aplica si la funcionaria tiene una solicitud activa en lista de pago o con resolución emitida
    if (!this.solicitudActiva || !this.solicitudActiva.enListaPagoActiva) {
      return false;
    }
    const limite = this.calcularFechaCumple2AnosPostulante();
    if (!limite) return false;
    return this.simuladorFecha.fechaActual >= limite;
  }

  abrirModalFormatoSolicitud(): void {
    this.mostrarModalFormato = true;
  }

  cerrarModalFormato(): void {
    this.mostrarModalFormato = false;
  }

  copiarPlantillaSolicitud(): void {
    const texto = `Bono Compensatorio por Derecho a Sala Cuna.

Santiago, [Fecha]

AL
SEÑOR
DIRECTOR GENERAL
POLICIA DE INVESTIGACIONES DE CHILE
PRESENTE

${this.funcionarioActual?.nombreCompleto || '[Nombre y Apellidos]'}, ${this.funcionarioActual?.escalafon || 'Oficial Policial'}, R.U.N. ${this.funcionarioActual?.rut || '[RUN]'}, de dotación ${this.funcionarioActual?.unidad || '[Unidad Policial]'}, con domicilio particular [INDICAR DOMICILIO PARTICULAR], al señor Director General respetuosamente expone y solicita:

1.- Que, con fecha [FECHA DE INGRESO A LA INSTITUCIÓN], ingresó a la institución.
2.- Que, con fecha ${this.funcionarioActual?.fechaNacimientoMenor || '[FECHA NACIMIENTO]'}, nació mi hijo(a) ${this.funcionarioActual?.nombreMenor || '[NOMBRE DEL MENOR]'}, quien vive a mis expensas desde la fecha de nacimiento.
3.- Que, el Informe Médico que se acompaña, da cuenta la condición de salud de mi hijo(a), cuyo tratamiento o cuidado son incompatibles con la asistencia a sala de cuna, requiriendo cuidados médicos de manera permanente, lo que impide su asistencia a una sala cuna convencional.
4.- Que, da cumplimiento a los requisitos señalados en la Orden General N° 2551, de 04.MAY.018, que Modifica O.G N° 874 de 07.ABR.986 que Aprueba Reglamento de Normas de Procedimiento para otorgamiento de Bono Compensatorio por Derecho a Sala Cuna, cuyo beneficio solo se mantendrá por el tiempo que acredite por prescripción médica la imposibilidad del hijo(a) de asistir a sala cuna y hasta los dos años de edad.

POR TANTO

Viene en solicitar al señor Director General ordenar a quien corresponda se reconozca Bono Compensatorio por Derecho a Sala Cuna, a su hijo(a) ${this.funcionarioActual?.nombreMenor || '[NOMBRE DEL MENOR]'}, donde recibe atención domiciliaria en [INDICAR DIRECCIÓN DOMICILIO PARTICULAR].`;

    navigator.clipboard.writeText(texto).then(() => {
      this.notificacionService.exito('Plantilla formal de Solicitud copiada al portapapeles.');
    });
  }

  ngOnInit(): void {
    // Sincronizar automáticamente el formulario del Día 30 con el emulador de calendario
    this.simuladorFecha.fecha$.subscribe(() => {
      this.formDia30.anio = this.simuladorFecha.anio;
      this.formDia30.mes = this.simuladorFecha.mes;
    });

    this.cargarPerfilPostulante();
  }

  cargarPerfilPostulante(): void {
    const sesion = this.authService.usuarioActual;
    const rutBuscar = sesion?.rut || '15432198-K';

    this.funcionarioService.obtenerPorRut(rutBuscar).subscribe({
      next: (func) => {
        this.establecerFuncionario(func);
      },
      error: () => {
        this.funcionarioService.listarTodos().subscribe({
          next: (lista) => {
            if (lista.length > 0) {
              this.establecerFuncionario(lista[0]);
            }
          }
        });
      }
    });
  }

  private establecerFuncionario(func: FuncionarioDto): void {
    this.funcionarioActual = func;
    this.formFicha = {
      rut: func.rut,
      nombres: func.nombres,
      apellidos: func.apellidos,
      codigoRegion: func.codigoRegion || 'RM',
      nombreRegion: func.nombreRegion || 'Región Metropolitana de Santiago',
      telefono: func.telefono || '',
      numeroSide: func.numeroSide || '',
      unidad: func.unidad || '',
      correoElectronico: func.correoElectronico,
      nombreMenor: func.nombreMenor || '',
      rutMenor: func.rutMenor || '',
      fechaNacimientoMenor: func.fechaNacimientoMenor || ''
    };
    this.cargarSolicitudes();
    this.cargarMisControles();
  }

  alCambiarRegion(): void {
    const reg = this.regionesChile.find(r => r.codigo === this.formFicha.codigoRegion);
    if (reg) this.formFicha.nombreRegion = reg.nombre;
  }

  guardarFichaPersonal(): void {
    this.funcionarioService.sincronizarPorRut(this.formFicha).subscribe({
      next: (guardado) => {
        this.establecerFuncionario(guardado);
        this.mostrarEdicionFicha = false;
        this.notificacionService.exito('Sus datos institucionales fueron actualizados.');
      }
    });
  }

  cargarSolicitudes(): void {
    if (!this.funcionarioActual) return;
    this.solicitudService.listarPorFuncionario(this.funcionarioActual.funcionarioID).subscribe({
      next: (lista) => {
        this.solicitudActiva = lista.length > 0 ? lista[0] : null;
      }
    });
  }

  cargarMisControles(): void {
    if (!this.funcionarioActual) return;
    this.controlMensualService.listarPorFuncionario(this.funcionarioActual.funcionarioID).subscribe({
      next: (lista) => (this.misControlesMensuales = lista)
    });
  }

  iniciarPostulacion(): void {
    if (!this.funcionarioActual) return;
    this.solicitudService
      .crearSolicitud({
        funcionarioID: this.funcionarioActual.funcionarioID,
        codigoRegion: this.funcionarioActual.codigoRegion || 'RM',
        montoMensualBase: 385000,
        cantidadDocumentosRequeridos: 5,
        observacionesIniciales: 'Postulación ingresada por la funcionaria solicitante.'
      })
      .subscribe({
        next: (nueva) => {
          this.solicitudActiva = nueva;
          this.notificacionService.exito(`Postulación #${nueva.solicitudID} iniciada. Adjunte sus documentos PDF.`);
        }
      });
  }

  obtenerDocumentoPorTipo(tipoCodigo: string): DocumentoInicialDto | undefined {
    return this.solicitudActiva?.documentosIniciales?.find(
      d => d.tipoDocumento.toLowerCase() === tipoCodigo.toLowerCase()
    );
  }

  alSeleccionarPdfInicial(event: Event, tipoCodigo: string): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0 || !this.solicitudActiva) return;

    const archivo = input.files[0];
    this.documentoService
      .subirDocumentoInicial(
        this.solicitudActiva.solicitudID,
        tipoCodigo,
        archivo,
        this.notificacionService.usuarioActual
      )
      .subscribe({
        next: () => {
          this.notificacionService.exito(`Documento '${tipoCodigo}' subido exitosamente.`);
          input.value = '';
          this.cargarSolicitudes();
        },
        error: () => {
          input.value = '';
        }
      });
  }

  obtenerUrlVisualizacionDoc(documentoId: number): string {
    return this.documentoService.obtenerUrlVisualizacion(documentoId);
  }

  obtenerUrlDescargaDoc(documentoId: number): string {
    return this.documentoService.obtenerUrlDescarga(documentoId);
  }

  obtenerUrlVisualizacionRespaldo(controlId: number): string {
    return this.controlMensualService.obtenerUrlVisualizacion(controlId);
  }

  obtenerUrlDescargaRespaldo(controlId: number): string {
    return this.controlMensualService.obtenerUrlArchivoRespaldo(controlId);
  }

  alCambiarTuvoCausal(tuvo: boolean): void {
    if (!tuvo) {
      this.formDia30.diasFeriadoLegal = 0;
      this.formDia30.diasAdministrativos = 0;
      this.formDia30.diasLicenciaMedica = 0;
    }
  }

  calcularDiasEfectivosPreview(): number {
    if (!this.formDia30.tuvoCausalDescuento) return 30;
    const desc =
      (this.formDia30.diasFeriadoLegal || 0) +
      (this.formDia30.diasAdministrativos || 0) +
      (this.formDia30.diasLicenciaMedica || 0);
    return Math.max(0, 30 - desc);
  }

  calcularMontoProporcionalPreview(): number {
    const base =
      this.solicitudActiva?.resolucion?.montoMensualAprobado ||
      this.solicitudActiva?.montoMensualBase ||
      385000;
    return Math.round((base / 30) * this.calcularDiasEfectivosPreview());
  }

  alSeleccionarPdfDia30(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivoDia30Seleccionado =
      input.files && input.files.length > 0 ? input.files[0] : null;
  }

  enviarDeclaracionDia30(): void {
    if (!this.solicitudActiva) return;
    this.controlMensualService
      .registrarDeclaracionDia30({
        solicitudID: this.solicitudActiva.solicitudID,
        anio: this.formDia30.anio,
        mes: this.formDia30.mes,
        tuvoCausalDescuento: this.formDia30.tuvoCausalDescuento,
        diasFeriadoLegal: this.formDia30.tuvoCausalDescuento ? this.formDia30.diasFeriadoLegal : 0,
        diasAdministrativos: this.formDia30.tuvoCausalDescuento ? this.formDia30.diasAdministrativos : 0,
        diasLicenciaMedica: this.formDia30.tuvoCausalDescuento ? this.formDia30.diasLicenciaMedica : 0,
        archivoRespaldo: this.archivoDia30Seleccionado,
        usuarioResponsable: this.notificacionService.usuarioActual
      })
      .subscribe({
        next: (c) => {
          this.notificacionService.exito(
            `Declaración del Día 30 enviada (${c.diasEfectivos}/30 días efectivos).`
          );
          this.cargarMisControles();
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

  previsualizarPdf(urlVisualizacion: string, titulo: string, urlDescarga?: string): void {
    this.pdfPreviewTitulo = titulo;
    this.pdfPreviewDescargaUrl = urlDescarga || '';
    this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(urlVisualizacion);
  }

  cerrarModalPdf(): void {
    this.pdfPreviewUrl = null;
    this.pdfPreviewTitulo = '';
    this.pdfPreviewDescargaUrl = '';
  }
}
