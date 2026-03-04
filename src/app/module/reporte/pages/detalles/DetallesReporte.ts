import {Component, inject, OnDestroy, OnInit, signal, ViewChild} from '@angular/core';
import {NgClass} from '@angular/common';
import {MenuItem, MessageService} from 'primeng/api';
import {Title} from '@/components/title';
import {Menubar} from 'primeng/menubar';
import {Button} from 'primeng/button';
import {SpinnerComponent} from '@/components/spinner.component';
import {FormsModule} from '@angular/forms';
import {InfoTicketComponent} from '@/module/reporte/component/generales/info-ticket.component';
import {Dialog} from 'primeng/dialog';
import {ActivatedRoute} from '@angular/router';
import {CompartirReporte} from '@/module/reporte/component/share-ticket/CompartirReporte';
import {CopyComponent} from '@/shared/component/copy/copy.component';
import {HistorialReporte} from '@/module/reporte/component/historial/HistorialReporte';
import {RegistrarActividadComponent} from '@/module/reporte/pages/registrar-actividad/registrar-actividad.component';
import {Estatus} from '@/models/reporte/estatus';
import {Unidad} from '@/models/empresa/unidad';
import {Ticket} from '@/models/reporte/ticket';
import {EVENTO_TICKET, TicketStatusService} from '@/shared/service/ticket-status.service';
import {Seguimiento} from '@/models/reporte/seguimiento';
import {Checklist} from '@/models/checklist/checklist';
import {EstatusPublicoService} from '@/shared/service/estatus-publico.service';
import {Subject, takeUntil} from 'rxjs';
import {TicketService} from '@/core/services/reporte/ticket.service';
import {buildCopyString} from '@/module/reporte/util/ReporteUtil';
import {TicketChecklistComponent} from '@/module/reporte/component/checklist/ticket-checklist.component';
import {AgregarChecklistComponent} from '@/module/reporte/component/agregar-checklist/agregar-checklist.component';
import {environment} from '@env/environment.development';
import {PdfGeneratorService} from '@/shared/service/pdf-generator.service';
import {ExcelGeneratorService} from '@/shared/service/excel-generator.service';

@Component({
    selector: 'ticket-detalles',
    imports: [
        NgClass,
        Title,
        Menubar,
        Button,
        SpinnerComponent,
        FormsModule,
        InfoTicketComponent,
        Dialog,
        CompartirReporte,
        CopyComponent,
        HistorialReporte,
        RegistrarActividadComponent,
        TicketChecklistComponent,
        AgregarChecklistComponent,
    ],
    templateUrl: './DetallesReporte.html',
    styleUrl: './DetallesReporte.scss',
})
export class DetallesReporte implements OnInit,
                                        OnDestroy {
    addSeguimiento: boolean;
    addChecklist: boolean=false;
    items: MenuItem[] | undefined;
    // State properties
    ticket: Ticket | null=null;
    historial=signal<Seguimiento[]>([]);
    checklist=signal<Checklist | null>(null);
    @ViewChild(HistorialReporte) historialComponent!: HistorialReporte;
    // Loading states
    proceso={
        cargando: true,
    };
    // ErrorProp handling
    errorMessage='';
    protected generalesCargado: boolean;
    protected abrirModalGenerales: boolean;
    protected abrirHistorial: boolean=false;
    protected cargandoGenerales: boolean;
    protected historialTieneDatos: boolean=false;
    protected unidad!: Unidad;
    protected readonly buildCopyString=buildCopyString;
    protected readonly estatus!: Estatus;
    private readonly URL_SERVER_FOLDER=environment.integraApi;
    private ticketStatusService=inject(TicketStatusService);
    private historialService=inject(EstatusPublicoService);
    // Rx Subscription management
    private destroy$=new Subject<void>();
    private ticketService=inject(TicketService);
    private notificacion=inject(MessageService);
    private route=inject(ActivatedRoute);
    private pdfService=inject(PdfGeneratorService);
    private excelService=inject(ExcelGeneratorService);

    ngOnInit(): void {
        this.items=[
            {
                label: 'Contacto',
                icon: 'pi pi-book',
                command: () => {
                    this.abrirGenerales();
                },
            },
            {
                label: 'PDF',
                icon: 'pi pi-download',
                command: () => {
                    this.descargarPdf();
                },
            },
            {
                label: 'Excel',
                icon: 'pi pi-file-excel',
                command: () => {
                    this.exportarExcel();
                },
            },
        ];
        const folio=this.route.snapshot.params['folio'];
        this.cargarDetallesTicket(folio);

        this.ticketStatusService.subject.subscribe({
            next: (data) => {
                if(data.key === EVENTO_TICKET.NUEVO_SEGUIMIENTO) {
                    this.actualizarDetalles();
                }
            },
        });

        this.historialService.estatus$.subscribe({
            next: (value) => {
                if(value) {
                    this.actualizarSoloHistorial();
                }
            },
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    actualizarDetalles() {
        if(this.ticket) {
            this.cargarDetallesTicket(this.ticket.folio);
        }
    }

    actualizarSoloHistorial() {
        if(this.ticket) {
            this.ticketService
                .obtenerHistorial(this.ticket.id)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (response) => {
                        this.historial.set(response.data);
                        this.historialTieneDatos=response.data?.length>0;
                    },
                });
        }
    }

    onChecklistSaved() {
        this.actualizarDetalles();
    }

    abrirGenerales() {
        let unidadId=this.ticket.unidad.id;
        if(unidadId) {
            this.generalesCargado=false;
            this.abrirModalGenerales=true;
            this.cargandoGenerales=true;
        }
    }

    /**
     * Descarga la información del ticket y su historial en formato PDF
     */
    async descargarPdf(): Promise<void> {
        if(!this.ticket) {
            this.notificacion.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'No hay información del ticket para descargar',
            });
            return;
        }

        try {
            await this.pdfService.generarPdfTicket(this.ticket, this.historial(), this.checklist());
            this.notificacion.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'PDF descargado correctamente',
            });
        } catch(error) {
            this.notificacion.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo generar el PDF',
            });
        }
    }

    /**
     * Exporta la información del ticket y su historial en formato Excel
     */
    async exportarExcel(): Promise<void> {
        if(!this.ticket) {
            this.notificacion.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'No hay información del ticket para exportar',
            });
            return;
        }

        try {
            await this.excelService.generarExcelTicket(this.ticket, this.historial());
            this.notificacion.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Excel exportado correctamente',
            });
        } catch(error) {
            this.notificacion.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo generar el Excel',
            });
        }
    }

    onHistorialDataChange(hasData: boolean): void {
        this.historialTieneDatos=hasData;
    }

    private cargarDetallesTicket(folio: string): void {
        if(!folio) return;
        this.proceso.cargando=true;
        this.ticketService
            .obtenerDetallesCompletos(folio)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.ticket=response.data.ticket;
                    this.historial.set(response.data.seguimientos);
                    this.checklist.set(response.data.checklist);
                    this.historialTieneDatos=response.data.seguimientos?.length>0;
                    this.proceso.cargando=false;
                },
                error: (error) => {
                    this.proceso.cargando=false;
                    this.notificacion.add({
                        life: 6000,
                        summary: 'Error',
                        detail: 'No se pudo obtener detalles del ticket',
                        severity: 'error',
                    });
                },
            });
    }
}
