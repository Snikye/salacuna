import { Routes } from '@angular/router';
import { authRoleGuard } from './core/guards/auth.guard';
import { VistaLoginComponent } from './features/login/vista-login.component';
import { VistaPostulanteComponent } from './features/postulante/vista-postulante.component';
import { VistaCoordinadorComponent } from './features/coordinador/vista-coordinador.component';
import { VistaVisadorComponent } from './features/visador/vista-visador.component';
import { VistaLogisticaComponent } from './features/logistica/vista-logistica.component';
import { VistaContabilidadComponent } from './features/contabilidad/vista-contabilidad.component';
import { VistaTesoreriaComponent } from './features/tesoreria/vista-tesoreria.component';
import { VistaAdministradorComponent } from './features/administrador/vista-administrador.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: VistaLoginComponent, title: 'Iniciar Sesión - Sala Cuna PDI' },
  {
    path: 'postulante',
    component: VistaPostulanteComponent,
    canActivate: [authRoleGuard],
    data: { roles: ['Postulante'] },
    title: 'Portal Postulante / Beneficiaria - Sala Cuna PDI'
  },
  {
    path: 'coordinador',
    component: VistaCoordinadorComponent,
    canActivate: [authRoleGuard],
    data: { roles: ['Coordinador'] },
    title: '1. Coordinador - Sala Cuna PDI'
  },
  {
    path: 'visador',
    component: VistaVisadorComponent,
    canActivate: [authRoleGuard],
    data: { roles: ['Visador'] },
    title: '2. Visador - Sala Cuna PDI'
  },
  {
    path: 'logistica',
    component: VistaLogisticaComponent,
    canActivate: [authRoleGuard],
    data: { roles: ['Logistica'] },
    title: '3. Logística - Sala Cuna PDI'
  },
  {
    path: 'finanzas',
    component: VistaContabilidadComponent,
    canActivate: [authRoleGuard],
    data: { roles: ['Finanzas'] },
    title: '4. Finanzas / DECOFI y Presupuesto 60-40 - Sala Cuna PDI'
  },
  {
    path: 'tesoreria',
    component: VistaTesoreriaComponent,
    canActivate: [authRoleGuard],
    data: { roles: ['Tesoreria'] },
    title: '5. Tesorería (Pago Final) - Sala Cuna PDI'
  },
  {
    path: 'administrador',
    component: VistaAdministradorComponent,
    canActivate: [authRoleGuard],
    data: { roles: ['Administrador'] },
    title: 'Administrador del Sistema (18441463-5) - Sala Cuna PDI'
  },
  { path: '**', redirectTo: 'login' }
];
