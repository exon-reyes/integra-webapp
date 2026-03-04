import {Component, inject, OnInit, signal} from '@angular/core';
import {TableModule} from 'primeng/table';
import {ZonaService} from '@/core/services/ubicacion/zona.service';
import {Zona} from '@/models/ubicacion/zona';
import {Button} from 'primeng/button';
import {InputText} from 'primeng/inputtext';
import {FormsModule} from '@angular/forms';
import {HasPermissionDirective} from '@/core/security/HasPermissionDirective';
import {Autoridades} from '@/core/Autoridades';
import {JWTService} from '@/core/security/JWTService';
import {ConfirmationService, MessageService} from 'primeng/api';
import {Tooltip} from 'primeng/tooltip';
import {StatWidgetComponent} from "@/components/stat-widget";
import {AlertComponent} from "@/components/alert";

@Component({
    selector: 'app-zonas',
    standalone: true,
    imports: [
        TableModule, Button, InputText, FormsModule, HasPermissionDirective, Tooltip, StatWidgetComponent,
        AlertComponent,
    ],
    templateUrl: './zonas.html',
    styleUrl: './zonas.scss',
})
export class Zonas implements OnInit {
    zonas=signal<Zona[]>([]);
    nombreZona='';
    zonaEditando: Zona | null=null;
    loading=false;
    protected readonly Autoridades=Autoridades;
    private securityService=inject(JWTService);
    private zonaService=inject(ZonaService);
    private confirmService=inject(ConfirmationService);
    private messageService=inject(MessageService);

    get zonasActivas() {
        return this.zonas().filter((z) => z.activo).length;
    }

    get zonasInactivas() {
        return this.zonas().filter((z) => !z.activo).length;
    }

    get totalZonas() {
        return this.zonas().length;
    }

    ngOnInit() {
        this.loadZonas();
    }

    loadZonas() {
        this.zonaService.obtenerZonas().subscribe({
            next: (response) => {
                this.zonas.set(response.data);
            },
        });
    }

    editarZona(zona: Zona) {
        this.zonaEditando=zona;
        this.nombreZona=zona.nombre;
    }

    guardarZona() {
        if(!this.nombreZona.trim()) return;
        this.loading=true;
        if(this.zonaEditando) {
            this.zonaService.actualizarZona({
                id: this.zonaEditando.id,
                nombre: this.nombreZona,
                activo: this.zonaEditando.activo,
            }).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Proceso completado',
                        detail: 'Zona actualizada',
                    });
                    this.loadZonas();
                    this.cancelarEdicion();
                    this.loading=false;
                },
                error: (err) => {
                    this.loading=false;
                },
            });
        } else {
            this.zonaService.registrarZona({nombre: this.nombreZona}).subscribe({
                next: () => {
                    this.loadZonas();
                    this.nombreZona='';
                    this.loading=false;
                },
                error: (err) => {
                    this.loading=false;
                },
            });
        }
    }

    cancelarEdicion() {
        this.zonaEditando=null;
        this.nombreZona='';
    }

    eliminarZona(zona: Zona) {
        this.confirmService.confirm({
            message: 'Deseas eliminar realmente la zona ' + zona.nombre + '?, todos los registros asociados no serán visibles para la zona',
            header: 'Desea realmente continuar?',
            icon: 'pi pi-info-circle',
            rejectLabel: 'Cancelar',
            rejectButtonProps: {
                label: 'Cancelar',
                severity: 'secondary',
                outlined: true,
            },
            acceptButtonProps: {
                label: 'Si, eliminar',
                severity: 'danger',
            },

            accept: () => {
                this.zonaService.eliminarZona(zona.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'info',
                            summary: 'Proceso completado',
                            detail: 'Zona eliminada',
                        });
                        this.loadZonas();
                    },
                });
            },
        });
    }

    toggleZonaActivo(zona: Zona) {
        this.zonaService.actualizarZona({id: zona.id, nombre: zona.nombre, activo: !zona.activo}).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'info',
                    summary: 'Actualización exitosa',
                    detail: 'El estado de la zona se actualizó correctamente.',
                });

                this.loadZonas();
            },
            error: (err) => {
            },
        });
    }
}
