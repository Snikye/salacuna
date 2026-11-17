import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificacionService } from '../services/notificacion.service';

export const authRoleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const notificacionService = inject(NotificacionService);
  const router = inject(Router);

  const sesion = authService.usuarioActual;
  if (!sesion) {
    router.navigate(['/login']);
    return false;
  }

  // El Administrador (RUT 18441463-5) puede acceder a todas las vistas para supervisión
  if (sesion.rol === 'Administrador') {
    return true;
  }

  const rolesPermitidos = route.data?.['roles'] as string[] | undefined;
  if (rolesPermitidos && rolesPermitidos.length > 0 && !rolesPermitidos.includes(sesion.rol)) {
    notificacionService.alerta(
      `Acceso restringido: Su perfil actual (${sesion.rol}) solo tiene autorización para su propia bandeja operativa.`
    );
    router.navigate([authService.obtenerRutaPorRol(sesion.rol)]);
    return false;
  }

  return true;
};
