import {Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Dialog} from 'primeng/dialog';
import {EMPTY, finalize, Subject, takeUntil} from 'rxjs';
import {InputText} from 'primeng/inputtext';
import {Select} from 'primeng/select';
import {Editor} from 'primeng/editor';
import {Button} from 'primeng/button';
import {MessageService} from 'primeng/api';

import {FormValidatorService} from '@/shared/service/form-validator.service';
import {SpinnerComponent} from '@/components/spinner.component';
import {Estatus} from '@/models/reporte/estatus';
import {Ticket} from '@/models/reporte/ticket';
import {TicketFactory} from '@/core/factories/ticket-factory';
import {EstatusService} from '@/core/services/reporte/estatus.service';
import {TicketService} from '@/core/services/reporte/ticket.service';
import {EstatusPublicoService} from '@/shared/service/estatus-publico.service';
import {EVENTO_TICKET, TicketStatusService} from '@/shared/service/ticket-status.service';
import {ImagenCompressionService} from '@/shared/service/imagen-compression.service';

@Component({
    selector: 'app-guardar-actividad',
    imports: [Dialog, ReactiveFormsModule, InputText, Select, Editor, Button, SpinnerComponent],
    templateUrl: './registrar-actividad.component.html',
    providers: [FormValidatorService],
    styleUrl: './registrar-actividad.component.scss',
})
export class RegistrarActividadComponent implements OnInit,
                                                    OnDestroy {
    procesando=false;
    seguimientoForm!: FormGroup;
    estatus: Estatus[]=[];
    archivoSeleccionado: File | null=null;

    @Input({required: true}) ticket!: Ticket;

    @Input() dialogVisible=false;

    @Output() closed=new EventEmitter<void>();

    @Output() saveSuccess=new EventEmitter<{ newStatus: Estatus }>();

    private ticketFactory=inject(TicketFactory);
    private readonly destroy$=new Subject<void>();
    private readonly formValidatorService=inject(FormValidatorService);
    private readonly estatusService=inject(EstatusService);
    private readonly ticketService=inject(TicketService);
    private readonly messageService=inject(MessageService);
    private readonly fb=inject(FormBuilder);
    private historialStatus=inject(EstatusPublicoService);
    private ticketStatusService=inject(TicketStatusService);
    private imageService=inject(ImagenCompressionService);

    constructor() {
        this.inicializarFormulario();
    }

    ngOnInit(): void {
        this.cargarEstatus();
        this.cancelarArchivo();
    }

    onFileChange(event: any) {
        const file=event.target.files[0];
        if(file && file.size<=52428800) {
            // 50MB limit
            if(file.type.startsWith('image/')) {
                this.comprimirImagen(file).then((compressedFile) => {
                    this.archivoSeleccionado=compressedFile;
                });
            } else {
                this.archivoSeleccionado=file;
            }
        } else if(file) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'El archivo es demasiado grande. Máximo 50MB.',
            });
            event.target.value='';
        }
    }

    cancelarArchivo() {
        this.archivoSeleccionado=null;
        const fileInput=document.querySelector('input[type="file"]') as HTMLInputElement;
        if(fileInput) fileInput.value='';
    }

    formatFileSize(bytes: number): string {
        if(bytes === 0) return '0 Bytes';
        const k=1024;
        const sizes=['Bytes', 'KB', 'MB', 'GB'];
        const i=Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async guardar() {
        if(this.seguimientoForm.invalid) {
            this.formValidatorService.marcarFormulario(this.seguimientoForm);
            return;
        }

        const datosFormulario=this.seguimientoForm.getRawValue();

        // Comprimir imágenes en el HTML del editor
        if(datosFormulario.descripcion) {
            datosFormulario.descripcion= await this.imageService.comprimirImagenesEnHtml(datosFormulario.descripcion);
        }

        this.procesando=true;
        const data=await this.ticketFactory.seguimientoDataRequest(this.ticket, datosFormulario);

        if(this.archivoSeleccionado) {
            const formData=new FormData();
            formData.append('agente', datosFormulario.agente);
            formData.append('folio', this.ticket.folio);
            formData.append('idEstatus', datosFormulario.estatus.id.toString());
            formData.append('descripcion', datosFormulario.descripcion || '');
            formData.append('idTicket', this.ticket.id.toString());
            formData.append('archivo', this.archivoSeleccionado);

            this.ticketService
                .agregarSeguimientoConArchivo(formData)
                .pipe(
                    takeUntil(this.destroy$),
                    finalize(() => (this.procesando=false)),
                )
                .subscribe({
                    next: (value) => {
                        this.mostrarMensajeExito();
                        this.saveSuccess.emit({newStatus: datosFormulario.estatus});
                        this.historialStatus.change(true);

                        this.cerrarDialogo();
                        this.ticketStatusService.execute(EVENTO_TICKET.NUEVO_SEGUIMIENTO, null);
                    },
                    error: (err) => {
                        this.handleError(err, 'No se pudo guardar el seguimiento');
                    },
                });
        } else {
            this.ticketService
                .agregarSeguimiento(data)
                .pipe(
                    takeUntil(this.destroy$),
                    finalize(() => (this.procesando=false)),
                )
                .subscribe({
                    next: (value) => {
                        this.mostrarMensajeExito();
                        this.saveSuccess.emit({newStatus: datosFormulario.estatus});
                        this.historialStatus.change(true);
                        this.cerrarDialogo();
                        this.ticketStatusService.execute(EVENTO_TICKET.NUEVO_SEGUIMIENTO, null);
                    },
                    error: (err) => {
                        this.handleError(err, 'No se pudieron cargar los estatus');
                    },
                });
        }
    }

    cerrarDialogo(): void {
        this.dialogVisible=false;
        this.closed.emit();
        this.seguimientoForm.reset();
        this.cancelarArchivo();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private comprimirImagen(file: File): Promise<File> {
        return new Promise((resolve) => {
            const canvas=document.createElement('canvas');
            const ctx=canvas.getContext('2d')!;
            const img=new Image();

            img.onload=() => {
                const maxWidth=1920;
                const maxHeight=1080;
                let {width, height}=img;

                if(width>height) {
                    if(width>maxWidth) {
                        height=(height * maxWidth) / width;
                        width=maxWidth;
                    }
                } else {
                    if(height>maxHeight) {
                        width=(width * maxHeight) / height;
                        height=maxHeight;
                    }
                }

                canvas.width=width;
                canvas.height=height;
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        const compressedFile=new File([blob!], file.name, {
                            type: file.type,
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    },
                    file.type,
                    0.8,
                );
            };

            img.src=URL.createObjectURL(file);
        });
    }

    private inicializarFormulario(): void {
        this.seguimientoForm=this.fb.group({
            agente: [null, Validators.required],
            estatus: [null, Validators.required],
            descripcion: [null],
        });
    }

    private cargarEstatus(): void {
        this.procesando=true;
        this.estatusService
            .obtenerEstatus()
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => (this.procesando=false)),
            )
            .subscribe({
                next: (value) => {
                    this.estatus=value.data;
                },
                error: (err) => {
                    this.handleError(err, 'No se pudieron cargar los estatus');
                },
            });
    }

    private mostrarMensajeExito(): void {
        this.messageService.add({
            severity: 'success',
            summary: 'Cambios guardados',
            detail: 'El seguimiento se ha registrado exitosamente',
        });
    }

    private handleError(error: any,
                        mensaje: string) {
        this.messageService.add({severity: 'error', summary: 'Error', detail: mensaje});
        return EMPTY;
    }
}
