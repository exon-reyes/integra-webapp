import {Routes} from '@angular/router';

export default [
    {
        path: '', loadComponent: () => import('./pages/vacaciones-page.component').then(m => m.VacacionesPageComponent),
    }, {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardVacacionesComponent),
    }, {
        path: 'solicitar',
        loadComponent: () => import('./components/solicitud/solicitud.component').then(m => m.SolicitudVacacionesComponent),
    },{
        path: 'descansos',
        loadComponent: () => import('./components/configuracion-descansos/configuracion-descansos.component').then(m => m.ConfiguracionDescansosComponent),
    },
] as Routes;
