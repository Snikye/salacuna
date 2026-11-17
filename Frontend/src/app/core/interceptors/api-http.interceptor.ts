import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, throwError } from 'rxjs';
import { NotificacionService } from '../services/notificacion.service';
import { SimuladorFechaService } from '../services/simulador-fecha.service';

/**
 * Sanitiza un valor de cabecera HTTP a caracteres ASCII válidos (ISO-8859-1 / ASCII imprimible)
 * para evitar que Kestrel o XMLHttpRequest rechacen cabeceras con tildes o caracteres especiales.
 */
function sanitizarHeaderAscii(valor: string): string {
  if (!valor) return 'Sistema';
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim() || 'Sistema';
}

/**
 * Interceptor funcional HTTP para adjuntar cabeceras de trazabilidad/token/fecha emulada
 * y gestionar errores HTTP provenientes de la API ASP.NET Core de forma centralizada.
 */
export const apiHttpInterceptor: HttpInterceptorFn = (req, next) => {
  const notificacionService = inject(NotificacionService);
  const simuladorFechaService = inject(SimuladorFechaService);
  notificacionService.iniciarCarga();

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('salacuna_pdi_token') : null;
  const usuarioResponsableAscii = sanitizarHeaderAscii(notificacionService.usuarioActual);

  let headers = req.headers
    .set('X-Usuario-Responsable', usuarioResponsableAscii)
    .set('X-Fecha-Emulada', simuladorFechaService.fechaFormatoIsoDate);

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  const peticionClonada = req.clone({ headers });

  return next(peticionClonada).pipe(
    catchError((error: HttpErrorResponse) => {
      let mensajeError = 'Error de comunicación con el servidor Backend.';

      if (error.status === 0) {
        mensajeError = 'No fue posible conectar con la API Backend (verifique que ASP.NET Core esté ejecutándose en el puerto 5228).';
      } else if (error.error && typeof error.error === 'object' && 'mensaje' in error.error) {
        mensajeError = error.error.mensaje;
      } else if (typeof error.error === 'string' && error.error.trim().length > 0) {
        mensajeError = error.error;
      } else if (error.message) {
        mensajeError = error.message;
      }

      const esBusquedaRut404 = error.status === 404 && req.url.includes('/api/funcionarios/rut/');
      if (!esBusquedaRut404) {
        notificacionService.error(mensajeError);
      }

      return throwError(() => error);
    }),
    finalize(() => {
      notificacionService.finalizarCarga();
    })
  );
};
