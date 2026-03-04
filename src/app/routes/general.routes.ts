import {Routes} from '@angular/router';
import {PermissionGuard} from '@/core/security/PermissionGuard';

export default [
    {
        path: 'unidades',
        canActivate: [PermissionGuard],
        // data: { permission: Autoridades.VER_SUBMODULO_UNIDADES },
        loadComponent: () => import('@/module/unidad/unidades').then((value) => value.Unidades),
    }, {
        path: 'unidades/nueva',
        loadComponent: () => import('@/module/unidad/nueva-unidad/nueva-unidad').then((value) => value.NuevaUnidad),
    },
] as Routes;
