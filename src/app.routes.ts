import {Routes} from '@angular/router';
import {Dashboard} from '@/pages/dashboard/dashboard';
import {AppLayout} from '@/layout/component/app.layout';
import {LoginGuard} from '@/core/security/LoginGuard';
import {AuthGuard} from '@/core/security/AuthGuard';
import {PermissionGuard} from '@/core/security/PermissionGuard';
import {Autoridades} from '@/core/Autoridades';

export const appRoutes: Routes=[
    {
        path: '',
        canActivate: [LoginGuard],
        loadComponent: () => import('@/pages/landing/landing').then((value) => value.Landing),
    },
    {
        path: 'integra', component: AppLayout, canActivate: [AuthGuard], children: [
            {path: '', component: Dashboard},
            {path: 'general', loadChildren: () => import('./app/routes/general.routes')},
            {
                path: 'empleado/admin',
                loadComponent: () => import('./app/module/empleado/admin/admin').then((value) => value.Admin),
                canActivate: [PermissionGuard],
            },
            {
                path: 'asistencia/admin',
                loadComponent: () => import('@/module/checador/modulos/modulos').then((value) => value.Modulos),
                canActivate: [PermissionGuard],
            },
            {
                path: 'asistencia/consulta',
                loadComponent: () => import('@/module/checador/admin/admin').then((value) => value.Admin),
                canActivate: [PermissionGuard],
            },
            {
                path: 'asistencia/manual',
                loadComponent: () => import('@/module/checador/registro-manual/registro-manual').then((value) => value.RegistroManualComponent),
                canActivate: [PermissionGuard],
            },
            {
                path: 'asistencia/mi-registro',
                loadComponent: () => import('@/module/checador/mi-registro/mi-registro').then((value) => value.MiRegistro),
                canActivate: [PermissionGuard],
            },
            {
                path: 'asistencia/compensacion',
                // data: {permission: Autoridades.COMPENSACIONES_VER},
                loadComponent: () => import('@/module/checador/compensaciones/compensaciones').then((value) => value.Compensaciones),
                canActivate: [PermissionGuard],
            },
            {
                path: 'asistencia/kioscos',
                data: {permission: Autoridades.CONFIG_RELOJ_VER_UNIDADES},
                loadComponent: () => import('@/module/checador/admin-kiosco/admin-kiosco').then((value) => value.AdminKiosco),
                canActivate: [PermissionGuard],
            },
            {
                path: 'cuenta/perfil',
                loadComponent: () => import('@/module/perfil/perfil').then((value) => value.Perfil),
                canActivate: [PermissionGuard],
            },
            {
                path: 'credenciales/admin',
                loadComponent: () => import('@/module/credencial/admin').then((value) => value.Admin),
                canActivate: [PermissionGuard],
                data: {permission: Autoridades.CREDENCIALES_VER},
            },
            {
                path: 'roles/admin',
                loadComponent: () => import('@/module/rol-admin/rol-admin').then((value) => value.RolAdmin),
                canActivate: [PermissionGuard],
                data: {permission: Autoridades.ROLES_VER_DETALLE},
            },
            {
                path: 'usuarios',
                canActivate: [PermissionGuard],
                data: {permission: Autoridades.USUARIOS_CONSULTAR},
                loadChildren: () => import('./app/routes/usuario.routes'),
            },
            {
                path: 'vacaciones',
                loadChildren: () => import('./app/modules/vacacion/vacacion.routes'),
            },
        ],
    },
    {path: 'notfound', loadComponent: () => import('@/pages/notfound').then((value) => value.Notfound)},
    {path: 'auth', loadChildren: () => import('@/routes/auth.routes')},
    {
        path: 'integra/checador', loadComponent: () => import('@/module/checador/app-v2/app-v2.component').then((value) => value.AppV2Component),
    },
    {path: '**', redirectTo: '/notfound'},
];
