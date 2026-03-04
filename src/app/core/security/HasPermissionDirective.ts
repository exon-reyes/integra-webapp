import {Directive, inject, Input, OnInit, TemplateRef, ViewContainerRef} from '@angular/core';
import {JWTService} from '@/core/security/JWTService';

/**
 * Directiva estructural que muestra u oculta un bloque
 * según los permisos del usuario autenticado.
 *
 * Ejemplo de uso:
 * <button *hasPermission="'ticket:create'">Crear ticket</button>
 * <div *hasPermission="['ticket:view', 'ticket:edit']; hasPermissionOperator: 'AND'"></div>
 */
@Directive({
    selector: '[hasPermission]',
    standalone: true,
})
export class HasPermissionDirective implements OnInit {
    /** Permisos requeridos (string o array) */
    @Input() hasPermission: string | string[]='';

    /** Operador lógico para permisos: 'AND' o 'OR' */
    @Input() hasPermissionOperator: 'AND' | 'OR'='OR';
    private jwtService=inject(JWTService);
    private templateRef=inject(TemplateRef<any>);
    private viewContainer=inject(ViewContainerRef);

    /** Alias para operador de permisos */
    @Input() set operator(value: 'AND' | 'OR') {
        this.hasPermissionOperator=value;
    }

    ngOnInit(): void {
        this.updateView();
    }

    /**
     * Renderiza o limpia la vista según los permisos actuales del usuario
     */
    private updateView(): void {
        if(this.checkAccess()) {
            this.viewContainer.createEmbeddedView(this.templateRef);
        } else {
            this.viewContainer.clear();
        }
    }

    /**
     * Verifica permisos del usuario
     */
    private checkAccess(): boolean {
        if(!this.hasPermission) return true;
        return this.checkPermissions();
    }

    /**
     * Valida los permisos del usuario según el operador (AND / OR)
     */
    private checkPermissions(): boolean {
        const required=Array.isArray(this.hasPermission)
            ? this.hasPermission
            : [this.hasPermission];

        if(this.hasPermissionOperator === 'AND') {
            return required.every(p => this.jwtService.hasAuthority(p));
        }
        return required.some(p => this.jwtService.hasAuthority(p));
    }
}
