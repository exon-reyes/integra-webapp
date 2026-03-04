import {Component, inject, Input, OnInit} from '@angular/core';
import {PanelModule} from 'primeng/panel';
import {Subject, Subscription, takeUntil} from 'rxjs';
import {SpinnerComponent} from '@/components/spinner.component';
import {NgOptimizedImage} from '@angular/common';
import {UnidadService} from '@/core/services/empresa/unidad.service';
import {Unidad} from '@/models/empresa/unidad';

@Component({
    selector: 'app-contacto',
    standalone: true,
    imports: [PanelModule, SpinnerComponent, NgOptimizedImage],
    template: `
        <p-panel class="mb-2" header="Información de contacto">
            @if (unidad) {

                <div class="flex flex-col">
                    <div class="flex flex-row gap-4 items-center">
                        <img alt="" height="32" ngSrc="assets/icon/contactus.svg" width="32">
                        <div class="flex flex-col">
                            <div>Unidad</div>
                            <div class="text-lg font-bold text-sky-900">{{ unidad.nombreCompleto }}</div>
                        </div>
                    </div>
                    @if (unidad.contacto.direccion) {
                        <div class="mt-3 border-b-1 pb-3 border-gray-200">{{ unidad.contacto.direccion }}</div>
                    }
                    <div class="flex flex-row mt-4">
                        <div class="grid md:grid-cols-3 gap-4 w-full grid-cols-2 lg:grid-cols-4">
                            @if (unidad.contacto.telefono) {
                                <div><i class="pi pi-phone mr-3"></i>{{ unidad.contacto.telefono }}</div>
                            }
                            @if (unidad.contacto.zona.nombre) {
                                <div><i
                                    class="pi pi-map mr-3"></i>{{ unidad.contacto.zona.nombre }}
                                    , {{ unidad.contacto.estado.nombre }}
                                </div>
                            }
                            @if (unidad.supervisor && unidad.supervisor.nombreCompleto) {
                                <div><i class="pi pi-user mr-3"></i>{{ unidad.supervisor.nombreCompleto }}</div>
                            }
                            @if (unidad.contacto.localizacion) {
                                <div><i class="pi pi pi-map-marker mr-3"></i>
                                    <a href="https://www.google.com/maps?q={{unidad.contacto.localizacion}}"
                                       target="_blank">
                                        Ver en Google Maps
                                    </a>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            } @else {
                <app-spinner></app-spinner>
            }
        </p-panel>
    `,
})
export class ContactoComponent implements OnInit {
    loading: boolean=true;
    @Input('id-unidad') idUnidad!: number;
    protected unidad: Unidad;
    private subscription: Subscription;
    private destroy$=new Subject<void>();
    private unidadService=inject(UnidadService);

    ngOnInit(): void {
        this.subscription=this.unidadService
            .obtenerContacto(this.idUnidad)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (value) => {
                    this.unidad=value.data; // Asigna los datos de contacto de la unidad.
                    this.loading=false;
                },
                error: () => (this.loading=false),
            });
    }
}
