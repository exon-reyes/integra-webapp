import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {MenuItem} from 'primeng/api';
import {AppMenuitem} from './app.menuitem';
import {Autoridades} from '@/core/Autoridades';
import {JWTService} from "@/core/security/JWTService";

/*
* // Single permission
{ label: 'Item', permission: 'crear_usuario' }

// Multiple permissions with OR (default)
{ label: 'Item', permission: ['crear_usuario', 'editar_usuario'] }

// Multiple permissions with AND
{ label: 'Item', permission: ['ver_reportes', 'exportar_datos'], permissionOperator: 'AND' }
*/
export interface CustomMenuItem extends MenuItem {
    id: string;
    permission?: string | string[];
    permissionOperator?: 'AND' | 'OR';
    items?: CustomMenuItem[];
}

@Component({
    selector: 'app-menu', standalone: true, imports: [CommonModule, AppMenuitem, RouterModule], template: `
        <ul class="layout-menu">
            @for (item of filteredModel; track item; let i = $index) {
                @if (!item.separator) {
                    <li
                        app-menuitem
                        [item]="item"
                        [index]="i"
                        [root]="true">
                    </li>
                } @else {
                    <li class="menu-separator"></li>
                }
            }
        </ul>

    `,
})
export class AppMenu implements OnInit {
    model: CustomMenuItem[]=[];
    filteredModel: CustomMenuItem[]=[];
    private jwtService=inject(JWTService);

    ngOnInit() {
        this.model=[
            {
                id: 'p1',
                label: 'Panel Principal',
                items: [{id: 'vista-general', label: 'Vista General', icon: 'isc i-layout', routerLink: ['/integra']}],
            }, {
                id: 'ug', label: 'Generales', items: [
                    {
                        id: 'mu',
                        label: 'Unidades',
                        permission: Autoridades.UNIDADES_CONSULTAR,
                        routerLink: ['general/unidades'],
                        icon: 'isc i-contact',
                    },
                ],
            }, {
                id: 'urrhh', label: 'GESTIÓN RRHH', icon: 'isc i-member', items: [
                    {
                        id: 'me',
                        label: 'Empleados',
                        permission: Autoridades.EMPLEADOS_CONSULTAR,
                        icon: 'isc i-member',
                        routerLink: ['empleado/admin'],
                    },
                ],
            }, {
                id: 'gv', label: 'Gestión de vacaciones', icon: 'isc i-register', items: [
                    {
                        id: 'mv',
                        label: 'Mis solicitudes',
                        permission: Autoridades.VACACIONES_CONSULTAR_SOLICITUDES,
                        icon: 'isc i-vacation',
                        routerLink: ['vacaciones/dashboard'],

                    }, {
                        id: 'gsv',
                        label: 'Gestor de solicitudes',
                        icon: 'isc i-autcalendar',
                        permission: Autoridades.VACACIONES_GESTOR_CONSULTAR,
                        routerLink: ['vacaciones/autorizacion'],
                    }
                ],
            }, {
                id: 'ga', label: 'GESTIÓN DE ASISTENCIA', icon: 'isc i-schedule', items: [
                    {
                        id: 'mga',
                        label: 'Gestor de asistencias',
                        icon: 'isc i-schedule',
                        routerLink: ['asistencia/admin'],
                    }, {
                        id: 'mmr',
                        label: 'Mis registros',
                        icon: 'isc i-register',
                        permission: Autoridades.ASISTENCIA_MI_REGISTRO,
                        routerLink: ['asistencia/mi-registro'],
                    },
                ],
            }, {
                id: 'ui', label: 'INFRAESTRUCTURA TI', items: [
                    {
                        id: 'mgc',
                        label: 'Gestión de Credenciales',
                        permission: Autoridades.CREDENCIALES_VER,
                        routerLink: ['credenciales/admin'],
                        icon: 'isc i-keypass',
                    }, {
                        id: 'mgr',
                        label: 'Gestión de Roles',
                        permission: Autoridades.ROLES_VER_DETALLE,
                        routerLink: ['roles/admin'],
                        icon: 'isc i-exchange',
                    }, {
                        id: 'mgu',
                        label: 'Gestión de usuarios',
                        permission: Autoridades.USUARIOS_CONSULTAR,
                        routerLink: ['usuarios'],
                        icon: 'isc i-user',
                    },
                ],
            },
        ];

        this.filteredModel=this.model.filter(item => this.hasVisibleChildren(item));
    }

    private hasVisibleChildren(item: CustomMenuItem): boolean {
        if(item.permission) {
            const required=Array.isArray(item.permission) ? item.permission : [item.permission];
            return item.permissionOperator === 'AND' ? required.every(p => this.jwtService.hasAuthority(p)) : required.some(p => this.jwtService.hasAuthority(p));
        }

        // Si no tiene items, mostrar (elementos sin hijos como separadores)
        if(!item.items || item.items.length === 0) {
            return true;
        }

        return item.items.some(child => this.hasVisibleChildren(child));
    }
}
