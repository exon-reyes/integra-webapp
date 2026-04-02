import {Routes} from '@angular/router';

export default [
    {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardVacacionesComponent),
    }, {
        path: 'solicitar',
        loadComponent: () => import('./components/solicitud/solicitud.component').then(m => m.SolicitudVacacionesComponent),
    }, {
        path: 'descansos',
        loadComponent: () => import('./components/configuracion-descansos/configuracion-descansos.component').then(m => m.ConfiguracionDescansosComponent),
    }, {
        path: 'autorizacion',
        children: [
            {
                path: '',
                loadComponent: () => import('./components/solicitudes/solicitudes').then(m => m.Solicitudes),
            },
            {
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
