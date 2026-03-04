import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    signal,
} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {forkJoin, Subject, takeUntil} from 'rxjs';
import {Unidad} from '@/models/empresa/unidad';
import {Area} from '@/models/area/area';
import {Estatus} from '@/models/reporte/estatus';
import {Empleado} from '@/models/empleado/empleado';
import {Zona} from '@/models/ubicacion/zona';
import {FiltroTicketService} from '@/core/filters/filtro-ticket.service';
import {UnidadService} from '@/core/services/empresa/unidad.service';
import {EstatusService} from '@/core/services/reporte/estatus.service';
import {AreaService} from '@/core/services/empresa/area.service';
import {ZonaService} from '@/core/services/ubicacion/zona.service';
import {EmpleadoService} from '@/core/services/empleado/empleado.service';
import {AppConfig} from '@/config/base.config';
import {filter} from 'rxjs/operators';
import {PropertiesFilter} from '@/shared/request/properties.filter';
import {fechaISOString, obtenerFinDia} from '@/shared/util/date.util';

@Component({
    selector: 'filtro-ticket',
    imports: [ReactiveFormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './filtro-ticket.component.html',
    styleUrl: './filtro-ticket.component.scss',
})
export class FiltroTicketComponent implements OnInit,
                                              OnDestroy {
    // Inputs y Outputs
    @Input() visible=false;
    // Listas para dropdowns
    unidades=signal<Unidad[]>(null);
    areas=signal<Area[]>(null);
    estatus=signal<Estatus[]>(null);
    supervisores=signal<Empleado[]>(null);
    zonas=signal<Zona[]>(null);
    // Propiedades del componente
    protected form: FormGroup;
    protected hoy=new Date();
    protected loading: boolean;
    @Output() private cerrar=new EventEmitter<void>();
    // Manejo de subscripciones
    private destroy$=new Subject<void>();

    constructor(
        private formBuilder: FormBuilder,
        private filtroService: FiltroTicketService,
        private unidadService: UnidadService,
        private estatusService: EstatusService,
        private areaService: AreaService,
        private zonaService: ZonaService,
        private supervisorService: EmpleadoService,
    ) {
        this.initForm();
        this.setupFiltroListener();
    }

    ngOnInit(): void {
        this.cargarDatosIniciales();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // Método público para cerrar el componente
    cerrarComponente(): void {
        this.visible=false;
        this.cerrar.emit();
    }

    // Buscar por filtro
    buscarPorFiltro(): void {
        const filtro=this.construirFiltro();
        this.filtroService.update(filtro);
        this.filtroService.execute('BUSCAR_POR_FILTRO', null);
        this.cerrarComponente();
    }

    // Limpiar filtro
    limpiarFiltro(): void {
        this.form.reset();
        this.buscarPorFiltro();
        this.filtroService.execute('REMOVE_FILTER', null);
    }

    // Inicialización del formulario
    private initForm(): void {
        this.form=this.formBuilder.group({
            publicar: [null],
            unidad: [null],
            supervisor: [null],
            zona: [null],
            estatus: [null],
            desde: [null],
            hasta: [null],
            area: [null],
        });
    }

    // Método para cargar datos iniciales
    private cargarDatosIniciales(): void {
        this.loading=true;
        forkJoin({
            units: this.unidadService.obtenerUnidades(),
            zonas: this.zonaService.obtenerZonas(),
            supervisores: this.supervisorService.obtenerEmpleados(AppConfig.ID_PUESTO_SUPERVISOR, AppConfig.ESTATUS_EMPLEADO_ACTIVO),
            status: this.estatusService.obtenerEstatus(),
            areas: this.areaService.obtenerAreas(null),
        })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (resultado) => {
                    this.unidades.set(resultado.units.data);
                    this.estatus.set(resultado.status.data);
                    this.zonas.set(resultado.zonas.data);
                    this.supervisores.set(resultado.supervisores.data);
                    this.areas.set(resultado.areas.data);
                },
            });
    }

    // Configurar listener de filtro
    private setupFiltroListener(): void {
        this.filtroService.subject
            .pipe(
                takeUntil(this.destroy$),
                filter((value) => value?.key === 'BUSCAR_FOLIO' || value?.key === 'REMOVE_FILTER'),
            )
            .subscribe(() => this.form.reset());
    }

    // Construir objeto de filtro
    private construirFiltro(): PropertiesFilter {
        const {unidad, area, estatus, supervisor, zona, desde, hasta, publicar}=this.form.value;

        return {
            unidadId: unidad?.id ?? null,
            estatusId: estatus?.id ?? null,
            areaId: area?.id ?? null,
            publicar: publicar,
            zonaId: zona?.id ?? null,
            supervisorId: supervisor?.id ?? null,
            hasta: hasta ? fechaISOString(obtenerFinDia(hasta)) : null,
            desde: desde ? fechaISOString(desde) : null,
            pagina: 0,
            filas: AppConfig.MAX_ROW_TABLE,
        };
    }
}
