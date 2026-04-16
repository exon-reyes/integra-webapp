import {Routes} from '@angular/router';

export default [
    {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardVacacionesComponent),
    }, {
        path: 'solicitar',
        loadComponent: () => import('./components/solicitud/solicitud.component').then(m => m.SolicitudVacacionesComponent),
    }, {
        path: 'saldos', loadComponent: () => import('./components/saldos/saldos').then(m => m.Saldos),
    }, {
        path: 'descansos',
        loadComponent: () => import('./components/configuracion-descansos/configuracion-descansos.component').then(m => m.ConfiguracionDescansosComponent),
    }, {
        path: 'configuracion', children: [
            {
                path: '',
                loadComponent: () => import('./components/config-vacation/config-vacation').then(m => m.ConfigVacation),
            }
        ]
    }, {
        path: 'autorizacion', children: [
            {
                path: '', loadComponent: () => import('./components/solicitudes/solicitudes').then(m => m.Solicitudes),
            }, {
                path: 'detalles/:folio',
                loadComponent: () => import('./components/detalles-solicitud/detalles-solicitud').then(m => m.DetallesSolicitud),
            }
        ]
    }, {
        path: '', redirectTo: '', pathMatch: 'full'
    }, {
        path: '**', redirectTo: '', pathMatch: 'full'
    }
] as Routes;
