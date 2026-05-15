import {Component, computed, effect, inject, OnDestroy, OnInit, signal, ViewChild} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {catchError, finalize, of, Subject, takeUntil} from 'rxjs';
import {WorktimeService} from '../service/worktime.service';
import {Empleado} from '@/core/services/checador/Empleado';
import {TipoPausa} from '@/core/services/checador/TipoPausa';
import {Title} from '@/components/title';
import {Button} from 'primeng/button';
import {InputText} from 'primeng/inputtext';
import {Asistencia, AsistenciaService, EmpleadoReporte, Pausa} from '@/core/services/asistencia/asistencia.service';
import {TableModule} from 'primeng/table';
import {Dialog} from 'primeng/dialog';
import {fechaISOString, obtenerFinDia, obtenerInicioDia, parseLocalDate} from '@/shared/util/date.util';
import {normalizeProperties} from '@/shared/util/object.util';
import {Panel} from "primeng/panel";
import {StateComponent} from "@/components/state.component";
import {PhotoViewerComponent} from '@/shared/component/photo-viewer/photo-viewer.component';
import {PhotoViewerService} from '@/shared/component/photo-viewer/photo-viewer.service';
import {AsistenciaCardComponent} from '@/components/asistencia/asistencia-card/asistencia-card.component';
import {ConfirmationService, MessageService} from "primeng/api";
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {
    RegistroEntradaDialogComponent,
    RegistroFormData,
} from '@/shared/component/registro-entrada-dialog/registro-entrada-dialog.component';
import {Listbox} from "primeng/listbox";
import {HasPermissionDirective} from "@/core/security/HasPermissionDirective";
import {Autoridades} from "@/core/Autoridades";
import {JWTService} from "@/core/security/JWTService";
import {CatalogoEmpleado, CatalogoEmpleadoService, FiltroEmpleado} from "@/service/catalogo-empleado.service";
import {RegistroValidationService} from './services/registro-validation.service';
import {DateTimeService} from './services/datetime.service';
import {REGISTRO_MESSAGES} from './constants/registro.constants';
import {SpinnerService} from "@/shared/service/spinner.service";
import {SpinnerComponent} from "@/components/spinner.component";
import {Calendar} from "@/components/calendar/calendar";
import {Accion} from "@/module/checador/registro-manual/util/util";
import {ResumenMes} from "@/components/asistencia/resumen-mes";

export interface OpcionAccion {
    value: Accion;
    label: string;
    svgIconName?: string;
}

export interface RegistroData {
    empleadoId: number;
    tipoAccion: Exclude<Accion, 'registrarJornadaCompleta'>;
    pausa?: TipoPausa;
    hora: string;
    observaciones: string;
    unidadId: number;
    unidadAsignadaId?: number;
}

@Component({
    selector: 'app-registro-manual', standalone: true, imports: [
        CommonModule,
        ReactiveFormsModule,
        Title,
        Button,
        InputText,
        FormsModule,
        Dialog,
        TableModule,
        Panel,
        NgOptimizedImage,
        StateComponent,
        PhotoViewerComponent,
        AsistenciaCardComponent,
        RegistroEntradaDialogComponent,
        ConfirmDialogModule,
        Listbox,
        HasPermissionDirective,
        SpinnerComponent,
        Calendar,
        ResumenMes,
    ], templateUrl: './registro-manual.html', styles: [``],
})
export class RegistroManualComponent implements OnInit,
                                                OnDestroy {
    date: Date | undefined=new Date();
    maxDate: Date=new Date();
    readonly empleadoBuscado=signal<Empleado | null>(null);
    readonly isLoading=signal(false);
    readonly error=signal<string | null>(null);
    readonly success=signal<string | null>(null);
    readonly unidades=signal<any[]>([]);
    readonly esRegistroDePausa=signal(false);
    readonly asistenciaSeleccionadaParaPausa=signal<Asistencia | null>(null);
    readonly accionEspecifica=signal<Accion | null>(null);
    readonly jornadas=signal<EmpleadoReporte[]>([]);
    readonly asistencias=signal<Asistencia[]>([]);
    readonly pausas=signal<Pausa[]>([]);
    readonly showEditJornadaDialog=signal(false);
    readonly showEditPausaDialog=signal(false);
    readonly showRegistroDialog=signal(false);
    readonly selectedJornada=signal<Asistencia | null>(null);
    readonly selectedPausa=signal<Pausa | null>(null);
    readonly tiposPausa=[
        {value: 'COMIDA' as TipoPausa, label: 'Comida'}, {value: 'OTRA' as TipoPausa, label: 'Otra'},
    ];
    readonly pausaActivaTexto=computed(() => {
        const empleado=this.empleadoBuscado();
        if(!empleado?.tipoPausa) return null;
        return this.tiposPausa.find(p => p.value === empleado.tipoPausa)?.label || empleado.tipoPausa;
    });
    @ViewChild(RegistroEntradaDialogComponent) registroDialog!: RegistroEntradaDialogComponent;
    empleadosActivos!: CatalogoEmpleado[];
    empleadoSeleccionado!: CatalogoEmpleado;
    readonly diasTrabajados=signal<Date[]>([]);
    protected readonly asistenciaService=inject(AsistenciaService);
    protected readonly permisoService=inject(JWTService)
    protected readonly Autoridades=Autoridades;
    protected readonly spinnerService=inject(SpinnerService)
    private messageService=inject(MessageService);
    private confirmationService=inject(ConfirmationService);
    private readonly destroy$=new Subject<void>();
    private readonly fb=inject(FormBuilder);
    readonly editJornadaForm=this.fb.group({
        inicioJornada: ['', Validators.required], finJornada: [''], comentario: [''],
    });
    editPausaForm=this.fb.group({
        inicio: ['', Validators.required], fin: [''],
    });
    private readonly dateChangeSignal=signal(0);
    readonly tiposAccion=computed(() => {
        this.dateChangeSignal();
        const esPausa=this.esRegistroDePausa();
        const empleado=this.empleadoBuscado();
        const accionesDisponibles=this.getAccionesDisponibles(empleado);
        if(this.accionEspecifica()) {
            return accionesDisponibles.filter(op => op.value === this.accionEspecifica());
        }
        if(esPausa) {
            const asistencia=this.asistenciaSeleccionadaParaPausa();
            let accionesPausa=accionesDisponibles.filter(op => op.value.toLowerCase().includes('pausa'));

            if(asistencia) {
                if(asistencia.jornadaCerrada) {
                    return accionesPausa.filter(op => op.value === 'registrarPausaCompleta');
                }
                const tienePausaActiva=asistencia.pausas && asistencia.pausas.some(p => !p.fin);
                if(tienePausaActiva) {
                    return accionesPausa.filter(op => op.value === 'finalizarPausa');
                } else {
                    return accionesPausa.filter(op => op.value !== 'finalizarPausa');
                }
            }
            return accionesPausa;
        } else {
            let accionesGeneral=accionesDisponibles.filter(op => {
                if(op.value === 'registrarJornadaCompleta') return true;
                if(op.value === 'iniciarJornada') return !empleado?.jornadaIniciada;
                return false;
            });
            if(this.date) {
                const today=new Date();
                today.setHours(0, 0, 0, 0);
                const selectedDate=new Date(this.date);
                selectedDate.setHours(0, 0, 0, 0);
                const diffTime=today.getTime() - selectedDate.getTime();
                const diffDays=Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if(diffDays>=2) {
                    accionesGeneral=accionesGeneral.filter(op => op.value === 'registrarJornadaCompleta');
                }
            }
            return accionesGeneral;
        }
    });
    private readonly worktimeService=inject(WorktimeService);
    private readonly photoViewerService=inject(PhotoViewerService);
    private readonly catalogoEmpleadoService=inject(CatalogoEmpleadoService)
    private readonly validationService=inject(RegistroValidationService);
    private readonly dateTimeService=inject(DateTimeService);

    constructor() {
        this.setupMessageEffects();
    }

    ngOnInit(): void {
        this.spinnerService.show();
        this.catalogoEmpleadoService.obtenerEmpleados(this.buildFilter())
            .pipe(finalize(() => this.spinnerService.hide()))
            .subscribe({
                next: value => {
                    this.empleadosActivos=value.data;
                },
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    buscarEmpleado(): void {
        const empleado=this.empleadoSeleccionado;

        if(!empleado || !empleado.codigo) {
            this.empleadoBuscado.set(null);
            this.jornadas.set([]);
            return;
        }


        const nip=empleado.codigo;
        this.isLoading.set(true);
        this.error.set(null);
        this.consultarFechasTrabajadasMes(empleado.id, this.date ?? new Date());
        this.worktimeService
            .consultarEmpleadoPorNip(nip)
            .pipe(takeUntil(this.destroy$), catchError(() => {
                return of(null);
            }), finalize(() => this.isLoading.set(false)))
            .subscribe(response => {
                if(response?.success) {
                    this.empleadoBuscado.set(response.data);
                    this.consultarJornadas(response.data.id);
                } else {
                    this.empleadoBuscado.set(null);
                    this.jornadas.set([]);
                }
            });
    }

    onRegistroSubmit(formData: RegistroFormData): void {
        const empleado=this.empleadoBuscado();
        if(!empleado) {
            this.mostrarError(REGISTRO_MESSAGES.ERROR.NO_EMPLEADO);
            return;
        }
        if(formData.tipoAccion === 'registrarJornadaCompleta') {
            this.registrarJornadaCompletaFromDialog(empleado, formData);
            return;
        }
        if(formData.tipoAccion === 'registrarPausaCompleta') {
            this.registrarPausaCompletaFromDialog(empleado, formData);
            return;
        }
        let horaRegistro: string | undefined=undefined;

        if(this.date && formData.hora && formData.hora.trim() !== '') {
            const fechaStr=this.dateTimeService.formatDate(this.date);
            horaRegistro=this.dateTimeService.combinarFechaHora(fechaStr, formData.hora);
            if(this.validationService.validarRegistroFuturo(horaRegistro)) {
                this.mostrarError(REGISTRO_MESSAGES.ERROR.REGISTRO_FUTURO);
                return;
            }
            if(formData.tipoAccion === 'finalizarJornada' && empleado.jornadaIniciada) {
                const jornadaActiva=this.jornadas().flatMap(r => r.asistencias).find(a => !a.finJornada);
                if(jornadaActiva) {
                    if(!this.validationService.validarHoraSalida(horaRegistro, jornadaActiva.inicioJornada)) {
                        this.mostrarError(`${REGISTRO_MESSAGES.ERROR.HORA_SALIDA_INVALIDA} (${this.dateTimeService.extractTime(jornadaActiva.inicioJornada)})`);
                        return;
                    }
                }
            }
        }
        const data: RegistroData={
            empleadoId: empleado.id,
            tipoAccion: formData.tipoAccion as any,
            hora: horaRegistro || '',
            pausa: formData.tipoPausa,
            observaciones: formData.observaciones || '',
            unidadId: formData.unidadId,
            unidadAsignadaId: empleado.unidadAsignadaId,
        };

        this.isLoading.set(true);
        this.error.set(null);

        this.worktimeService.registroManual(data as any)
            .pipe(takeUntil(this.destroy$), finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: (response) => {
                    if(response.success) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Completado',
                            detail: REGISTRO_MESSAGES.SUCCESS.REGISTRO_AGREGADO,
                        })
                        this.showRegistroDialog.set(false);
                        this.actualizarDatosEmpleado(empleado.id);
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: response.message || 'Error al agregar el registro',
                        })
                    }
                },
            });
    }

    consultarJornadas(empleadoId: number): void {
        const params: any={empleadoId};
        const fechaConsulta=this.date || new Date();
        params.desde=fechaISOString(obtenerInicioDia(fechaConsulta));
        params.hasta=fechaISOString(obtenerFinDia(fechaConsulta));
        this.asistenciaService.obtenerAsistencias(params)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: response => {
                    if(response?.success) {
                        this.jornadas.set(response.data);
                        this.actualizarAsistencias();
                    }
                },
            });
    }

    actualizarAsistencias(): void {
        const jornadasData=this.jornadas();
        if(jornadasData.length>0) {
            const todasAsistencias=jornadasData[0].asistencias || []
            const fechaFiltro: string=this.dateTimeService.formatDate(this.date || new Date());
            const asistenciasFiltradas=todasAsistencias.filter(a => a.fecha === fechaFiltro);
            this.asistencias.set(asistenciasFiltradas);
            const todasPausas=asistenciasFiltradas.flatMap(a => a.pausas || []);
            this.pausas.set(todasPausas);
        } else {
            this.asistencias.set([]);
            this.pausas.set([]);
        }
    }

    abrirDialogoRegistro(): void {
        this.esRegistroDePausa.set(false);
        this.accionEspecifica.set(null);
        this.asistenciaSeleccionadaParaPausa.set(null);
        this.showRegistroDialog.set(true);
    }

    editarJornada(jornada: Asistencia): void {
        this.selectedJornada.set(jornada);
        this.editJornadaForm.patchValue({
            inicioJornada: this.dateTimeService.extractTime(jornada.inicioJornada),
            finJornada: jornada.finJornada ? this.dateTimeService.extractTime(jornada.finJornada) : '',
            comentario: '',
        });
        this.showEditJornadaDialog.set(true);
    }

    agregarPausa(asistencia: Asistencia): void {
        if(!asistencia) return;
        const fechaParts=asistencia.fecha.split('-');
        this.date=new Date(parseInt(fechaParts[0]), parseInt(fechaParts[1]) - 1, parseInt(fechaParts[2]));
        this.onDateChange();
        this.esRegistroDePausa.set(true);
        this.accionEspecifica.set(null);
        this.asistenciaSeleccionadaParaPausa.set(asistencia);
        this.showRegistroDialog.set(true);
        setTimeout(() => {
            if(this.registroDialog) {
                this.registroDialog.seleccionarAccion('registrarPausaCompleta');
            }
        }, 0);
    }

    finalizarJornada(asistencia: Asistencia): void {
        if(!asistencia) return;
        const fechaParts=asistencia.fecha.split('-');
        this.date=new Date(parseInt(fechaParts[0]), parseInt(fechaParts[1]) - 1, parseInt(fechaParts[2]));
        this.onDateChange();
        this.esRegistroDePausa.set(false);
        this.accionEspecifica.set('finalizarJornada');
        this.showRegistroDialog.set(true);
        setTimeout(() => {
            if(this.registroDialog) {
                this.registroDialog.seleccionarAccion('finalizarJornada');
            }
        }, 0);
    }

    guardarJornada(): void {
        const jornada=this.selectedJornada();
        if(!jornada) return;
        const formValue=this.editJornadaForm.value;
        const fechaJornada=jornada.fecha; // Formato: YYYY-MM-DD
        let inicioJornada: string | undefined=undefined;
        if(formValue.inicioJornada && typeof formValue.inicioJornada === 'string' && formValue.inicioJornada.trim() !== '') {
            inicioJornada=this.dateTimeService.combinarFechaHora(fechaJornada, formValue.inicioJornada);
        }
        let finJornada: string | undefined=undefined;
        if(formValue.finJornada && typeof formValue.finJornada === 'string' && formValue.finJornada.trim() !== '') {
            const horaInicio=formValue.inicioJornada || jornada.inicioJornada;
            const horaFin=formValue.finJornada;
            if(this.dateTimeService.esJornadaNocturna(horaInicio, horaFin)) {
                // Agregar un día a la fecha de fin
                const fechaFinDate=new Date(fechaJornada);
                fechaFinDate.setDate(fechaFinDate.getDate() + 1);
                const fechaFinStr=fechaFinDate.toISOString().split('T')[0]; // YYYY-MM-DD
                finJornada=this.dateTimeService.combinarFechaHora(fechaFinStr, horaFin);
            } else {
                finJornada=this.dateTimeService.combinarFechaHora(fechaJornada, horaFin);
            }
        }
        if(finJornada && this.validationService.validarRegistroFuturo(finJornada)) {
            this.mostrarError('No puedes finalizar una jornada en una fecha/hora futura.');
            return;
        }
        const body=normalizeProperties({
            jornadaId: jornada.id, inicioJornada, finJornada, comentario: formValue.comentario,
        }, {removeEmptyString: true});

        this.isLoading.set(true);
        this.asistenciaService.actualizarJornada(body)
            .pipe(takeUntil(this.destroy$), finalize(() => this.isLoading.set(false)))
            .subscribe(response => {
                if(response?.success) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Procesado',
                        detail: REGISTRO_MESSAGES.SUCCESS.JORNADA_ACTUALIZADA,
                    });
                    this.showEditJornadaDialog.set(false);
                    this.buscarEmpleado();
                    this.consultarJornadas(this.empleadoBuscado()!.id);
                } else {
                    this.messageService.add({detail: 'Error al actualizar jornada'})
                }
            });
    }

    eliminarPausa(pausa: Pausa): void {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que deseas eliminar esta pausa?',
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.isLoading.set(true);
                this.asistenciaService.eliminarPausa(pausa.id).pipe(finalize(() => this.isLoading.set(false))).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Procesado',
                            detail: REGISTRO_MESSAGES.SUCCESS.PAUSA_ELIMINADA,
                        });
                        this.actualizarDatosEmpleado(this.empleadoBuscado()!.id);
                    }, error: (err) => {
                        this.messageService.add({
                            severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la pausa',
                        });
                    },
                });
            },
        });
    }

    eliminarJornada(jornada: Asistencia): void {
        this.confirmationService.confirm({
            message: '¿Está seguro de eliminar esta jornada?',
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            rejectButtonStyleClass: 'p-button-text p-button-secondary',
            accept: () => {
                this.isLoading.set(true);
                this.asistenciaService.eliminarJornada(jornada.id)
                    .pipe(takeUntil(this.destroy$), finalize(() => this.isLoading.set(false)))
                    .subscribe(response => {
                        if(response?.success) {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Procesado',
                                detail: REGISTRO_MESSAGES.SUCCESS.JORNADA_ELIMINADA,
                            });
                            this.actualizarDatosEmpleado(this.empleadoBuscado()!.id);
                        } else {
                            this.error.set('Error al eliminar jornada');
                        }
                    });
            },
        });
    }

    editarPausa(pausa: Pausa): void {
        this.selectedPausa.set(pausa);
        this.editPausaForm.patchValue({
            inicio: this.dateTimeService.extractTime(pausa.inicio),
            fin: pausa.fin ? this.dateTimeService.extractTime(pausa.fin) : '',
        });
        this.showEditPausaDialog.set(true);
    }

    guardarPausa(): void {
        const pausa=this.selectedPausa();
        if(!pausa) return;
        const formValue=this.editPausaForm.value;
        const asistenciaConPausa=this.asistencias().find(a => a.pausas?.some(p => p.id === pausa.id));
        if(!asistenciaConPausa) {
            this.error.set('No se pudo determinar la fecha de la pausa');
            return;
        }
        const fechaPausa=asistenciaConPausa.fecha; // Formato: YYYY-MM-DD
        let inicio: string | undefined=undefined;
        if(formValue.inicio && formValue.inicio.trim() !== '') {
            inicio=this.dateTimeService.combinarFechaHora(fechaPausa, formValue.inicio);
        }
        let fin: string | undefined=undefined;
        if(formValue.fin && formValue.fin.trim() !== '') {
            const horaInicio=formValue.inicio || pausa.inicio;
            const horaFin=formValue.fin;
            if(this.dateTimeService.esJornadaNocturna(horaInicio, horaFin)) {
                const fechaFinDate=new Date(fechaPausa);
                fechaFinDate.setDate(fechaFinDate.getDate() + 1);
                const fechaFinStr=fechaFinDate.toISOString().split('T')[0]; // YYYY-MM-DD
                fin=this.dateTimeService.combinarFechaHora(fechaFinStr, horaFin);
            } else {
                fin=this.dateTimeService.combinarFechaHora(fechaPausa, horaFin);
            }
        }
        if(fin && this.validationService.validarRegistroFuturo(fin)) {
            this.mostrarError('No puedes finalizar una pausa en una fecha/hora futura.');
            return;
        }
        const body=normalizeProperties({
            pausaId: pausa.id, inicio, fin,
        }, {removeEmptyString: true});

        this.isLoading.set(true);
        this.asistenciaService.actualizarPausa(body)
            .pipe(takeUntil(this.destroy$), finalize(() => this.isLoading.set(false)))
            .subscribe(response => {
                if(response?.success) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Procesado',
                        detail: REGISTRO_MESSAGES.SUCCESS.PAUSA_ACTUALIZADA,
                    });
                    this.showEditPausaDialog.set(false);
                    this.consultarJornadas(this.empleadoBuscado()!.id);
                } else {
                    this.error.set('Error al actualizar pausa');
                }
            });
    }

    actualizarTabla(): void {
        if(this.empleadoBuscado()) {
            this.consultarJornadas(this.empleadoBuscado()!.id);
        }
    }

    verFoto(pathFoto: string,
            tipo: string,
            fecha: string): void {
        const urlCompleta=`${this.asistenciaService.apiUrlImagen}/${pathFoto}`;
        const titulo=`${tipo} - ${fecha}`;
        this.photoViewerService.open(urlCompleta, titulo);
    }

    onDateChange(): void {
        this.dateChangeSignal.update(v => v + 1);
        if(this.date && this.empleadoBuscado()) {
            this.consultarJornadas(this.empleadoBuscado()!.id);
        }
    }

    public esHoy(date: Date | undefined): boolean {
        if(!date) return false;
        const today=new Date();
        return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    }

    consultarDiasTrabajados(fecha: Date) {
        if(this.empleadoBuscado() && this.empleadoBuscado()!.id) {
            this.consultarFechasTrabajadasMes(this.empleadoSeleccionado.id, fecha)
        } else {
            this.diasTrabajados.set([])
        }
    }

    protected diaSeleccionado(): void {
        const empleado=this.empleadoBuscado();
        if(empleado) {
            this.consultarJornadas(empleado.id);
        }
    }

    protected permitirEditar() {
        return this.permisoService.hasAuthority(Autoridades.ASISTENCIA_MANUAL_AGREGAR)
    }

    private consultarFechasTrabajadasMes(idEmpleado: number,
                                         fecha: Date): void {
        const id=idEmpleado
        if(!id) return;
        const params={
            empleadoId: id,
            anio: fecha.getFullYear(),
            mes: fecha.getMonth() + 1,
        };
        this.asistenciaService.obtenerDiasLaborados(params)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    const raw=res?.data ?? [];
                    this.diasTrabajados.set(raw.map((s) => parseLocalDate(s)));
                },
            });
    }

    private mostrarError(mensaje: string): void {
        this.messageService.add({detail: mensaje, severity: 'warn'});
    }

    private registrarJornadaCompletaFromDialog(empleado: Empleado,
                                               formData: RegistroFormData): void {
        if(!this.date) {
            this.mostrarError(REGISTRO_MESSAGES.ERROR.FECHA_REQUERIDA);
            return;
        }
        if(!formData.horaInicio?.trim()) {
            this.mostrarError(REGISTRO_MESSAGES.ERROR.HORA_INICIO_REQUERIDA);
            return;
        }
        const diffDays=this.validationService.calcularDiferenciaDias(this.date);
        if(!this.validationService.validarHoraInicioAyer(formData.horaInicio, diffDays)) {
            this.mostrarError(REGISTRO_MESSAGES.ERROR.HORA_AYER_INVALIDA);
            return;
        }
        if(!formData.horaFin?.trim()) {
            this.mostrarError(REGISTRO_MESSAGES.ERROR.HORA_FIN_REQUERIDA);
            return;
        }
        const fechaStr=this.dateTimeService.formatDate(this.date);
        const inicioJornada=this.dateTimeService.combinarFechaHora(fechaStr, formData.horaInicio);
        const finJornada=this.dateTimeService.esJornadaNocturna(formData.horaInicio, formData.horaFin) ? this.construirFechaFinNocturna(fechaStr, formData.horaFin) : this.dateTimeService.combinarFechaHora(fechaStr, formData.horaFin);
        if(this.validationService.validarRegistroFuturo(finJornada)) {
            this.mostrarError(REGISTRO_MESSAGES.ERROR.REGISTRO_FUTURO);
            return;
        }
        this.ejecutarRegistroJornada(empleado, inicioJornada, finJornada, formData);
    }

    private ejecutarRegistroJornada(empleado: Empleado,
                                    inicioJornada: string,
                                    finJornada: string,
                                    formData: RegistroFormData): void {
        const data={
            empleadoId: empleado.id,
            inicioJornada,
            finJornada,
            comentario: formData.observaciones || undefined,
            unidadId: formData.unidadId,
        };
        this.isLoading.set(true);
        this.error.set(null);
        this.asistenciaService.crearJornadaCompleta(data)
            .pipe(takeUntil(this.destroy$), finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: (response) => {
                    if(response.success) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Procesado',
                            detail: REGISTRO_MESSAGES.SUCCESS.JORNADA_COMPLETA,
                        });
                        this.showRegistroDialog.set(false);
                        this.actualizarDatosEmpleado(empleado.id);
                    } else {
                        this.messageService.add({
                            detail: response.message || 'Error al registrar jornada completa',
                            severity: 'error',
                            summary: 'Error al registrar',
                        });
                    }
                },
            });
    }

    private registrarPausaCompletaFromDialog(empleado: Empleado,
                                             formData: RegistroFormData): void {
        if(!this.date) {
            this.mostrarError(REGISTRO_MESSAGES.ERROR.FECHA_REQUERIDA);
            return;
        }
        if(!formData.horaInicio || !formData.horaFin) {
            this.mostrarError('Debe especificar hora de inicio y fin');
            return;
        }
        if(!formData.tipoPausa) {
            this.mostrarError(REGISTRO_MESSAGES.ERROR.TIPO_PAUSA_REQUERIDO);
            return;
        }
        const fechaStr=this.dateTimeService.formatDate(this.date);
        const inicio=this.dateTimeService.combinarFechaHora(fechaStr, formData.horaInicio);
        const jornadaCerrada=this.jornadas().flatMap(r => r.asistencias).find(a => a.fecha === fechaStr && a.finJornada);
        let fin: string;
        if(jornadaCerrada) {
            const inicioPausaDate=new Date(inicio);
            if(this.dateTimeService.esJornadaNocturna(formData.horaInicio, formData.horaFin)) {
                fin=this.construirFechaFinNocturna(fechaStr, formData.horaFin);
            } else {
                fin=this.dateTimeService.combinarFechaHora(fechaStr, formData.horaFin);
            }
            const finPausaDate=new Date(fin);
            if(!this.validationService.validarPausaDentroDeJornada(inicioPausaDate, finPausaDate, jornadaCerrada)) {
                this.mostrarError(`${REGISTRO_MESSAGES.ERROR.PAUSA_FUERA_RANGO} (${this.dateTimeService.extractTime(jornadaCerrada.inicioJornada)} - ${this.dateTimeService.extractTime(jornadaCerrada.finJornada!)})`);
                return;
            }
        } else {
            if(this.dateTimeService.esJornadaNocturna(formData.horaInicio, formData.horaFin)) {
                fin=this.construirFechaFinNocturna(fechaStr, formData.horaFin);
            } else {
                fin=this.dateTimeService.combinarFechaHora(fechaStr, formData.horaFin);
            }
        }
        if(this.validationService.validarRegistroFuturo(fin)) {
            this.mostrarError('No puedes registrar una pausa con fecha/hora futura.');
            return;
        }
        const data={
            empleadoId: empleado.id,
            asistenciaId: jornadaCerrada ? jornadaCerrada.id : (this.jornadas().flatMap(j => j.asistencias).find(a => !a.finJornada)?.id),
            inicio,
            fin,
            tipoPausa: formData.tipoPausa,
            unidadId: formData.unidadId,
        };
        if(!data.asistenciaId) {
            this.mostrarError(REGISTRO_MESSAGES.ERROR.SIN_ASISTENCIA);
            return;
        }
        this.isLoading.set(true);
        this.asistenciaService.registrarPausaCompleta(data)
            .pipe(takeUntil(this.destroy$), finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: (response) => {
                    if(response.success) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Procesado',
                            detail: REGISTRO_MESSAGES.SUCCESS.PAUSA_COMPLETA,
                        });
                        this.showRegistroDialog.set(false);
                        this.actualizarDatosEmpleado(empleado.id);
                    } else {
                        this.error.set(response.message || 'Error al registrar pausa');
                    }
                }, error: (err) => {
                    this.error.set(err.error?.message || 'Error al registrar pausa');
                },
            });
    }

    private construirFechaFinNocturna(fechaStr: string,
                                      horaFin: string): string {
        const fechaFinDate=new Date(fechaStr);
        fechaFinDate.setDate(fechaFinDate.getDate() + 1);
        const fechaFinStr=fechaFinDate.toISOString().split('T')[0];
        return this.dateTimeService.combinarFechaHora(fechaFinStr, horaFin);
    }

    private actualizarDatosEmpleado(empleadoId: number): void {
        this.buscarEmpleado();
        this.consultarJornadas(empleadoId);

    }

    private setupMessageEffects(): void {
        effect(() => {
            const msg=this.success();
            if(msg) setTimeout(() => this.success.set(null), 3000);
        });
        effect(() => {
            const msg=this.error();
            if(msg) setTimeout(() => this.error.set(null), 5000);
        });
    }

    private getAccionesDisponibles(empleado: Empleado | null): OpcionAccion[] {
        if(!empleado) return [];
        const opciones: OpcionAccion[]=[
            {value: 'registrarJornadaCompleta', label: 'Registrar Jornada Completa', svgIconName: 'pi-briefcase'},
            {value: 'registrarPausaCompleta', label: 'Registrar Pausa Completa'},
        ];
        if(!empleado.jornadaIniciada) {
            opciones.push({value: 'iniciarJornada', label: 'Iniciar Jornada', svgIconName: 'pi-play-circle'});
        } else {
            opciones.push({value: 'finalizarJornada', label: 'Finalizar Jornada'});
            if(!empleado.tipoPausa) {
                opciones.push({value: 'iniciarPausa', label: 'Iniciar Pausa'});
            } else {
                opciones.push({value: 'finalizarPausa', label: 'Finalizar Pausa'});
            }
        }
        return opciones;
    }

    private buildFilter(): FiltroEmpleado {
        if(this.permisoService.hasAuthority(Autoridades.ASISTENCIA_MANUAL_FILTRAR_SUPERVISOR)) {
            return {idSupervisor: this.permisoService.getUser().employeeName.id, activos: true}
        } else if(this.permisoService.hasAuthority(Autoridades.ASISTENCIA_MANUAL_EMPLEADOS_RESPONSABLES)) {
            return {idResponsable: this.permisoService.getUser().employeeName.id, activos: true}
        } else {
            return {activos: true}
        }
    }
}
