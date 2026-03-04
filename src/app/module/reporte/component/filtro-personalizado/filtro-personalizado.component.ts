import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    inject,
    Input,
    OnDestroy,
    OnInit,
    Output,
    signal,
} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {forkJoin, Subject, takeUntil} from 'rxjs';
import {Drawer} from 'primeng/drawer';
import {DatePicker} from 'primeng/datepicker';
import {Select} from 'primeng/select';
import {Button} from 'primeng/button';
import {Unidad} from '@/models/empresa/unidad';
import {Estatus} from '@/models/reporte/estatus';
import {Empleado} from '@/models/empleado/empleado';
import {Zona} from '@/models/ubicacion/zona';
import {Departamento} from '@/models/empresa/departamento';
import {FiltroPersonalizadoService} from '@/core/filters/filtro-personalizado.service';
import {UnidadService} from '@/core/services/empresa/unidad.service';
import {EstatusService} from '@/core/services/reporte/estatus.service';
import {ZonaService} from '@/core/services/ubicacion/zona.service';
import {EmpleadoService} from '@/core/services/empleado/empleado.service';
import {DepartamentoService} from '@/core/services/empresa/departamento.service';
import {AppConfig} from '@/config/base.config';
import {PropertiesFilter} from '@/shared/request/properties.filter';
import {fechaISOString, obtenerFinDia} from '@/shared/util/date.util';
import {JWTService} from '@/core/security/JWTService';

@Component({
    selector: 'filtro-personalizado',
    imports: [Drawer, ReactiveFormsModule, DatePicker, Select, Button],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './filtro-personalizado.component.html',
    styleUrl: './filtro-personalizado.component.scss',
})
export class FiltroPersonalizadoComponent implements OnInit,
                                                     OnDestroy {
    @Input() visible=false;
    @Output() cerrar=new EventEmitter<void>();
    @Output() filtrosAplicados=new EventEmitter<PropertiesFilter>();
    // Listas para dropdowns
    unidades=signal<Unidad[]>([]);
    // areas = signal<Area[]>([]);
    estatus=signal<Estatus[]>([]);
    supervisores=signal<Empleado[]>([]);
    zonas=signal<Zona[]>([]);
    departamentos=signal<Departamento[]>([]);
    protected form: FormGroup;
    protected hoy=new Date();
    private idUsuario;
    private authService=inject(JWTService);
    private destroy$=new Subject<void>();

    constructor(
        private formBuilder: FormBuilder,
        private filtroService: FiltroPersonalizadoService,
        private unidadService: UnidadService,
        private estatusService: EstatusService, // private areaService: AreaService,
        private zonaService: ZonaService,
        private supervisorService: EmpleadoService,
        private departamentoService: DepartamentoService,
    ) {
        this.initForm();
    }

    ngOnInit(): void {
        this.idUsuario=this.authService.getUser().id;
        this.cargarDatos();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    cerrarComponente(): void {
        this.visible=false;
        this.cerrar.emit();
    }

    aplicarFiltros(): void {
        const filtro=this.construirFiltro();
        this.filtroService.update(filtro);
        this.filtroService.execute('APLICAR_FILTROS', null);
        this.filtrosAplicados.emit(filtro);
        this.cerrarComponente();
    }

    limpiarFiltros(): void {
        this.form.reset();
        this.filtroService.execute('LIMPIAR_FILTROS', null);
        this.filtrosAplicados.emit(this.construirFiltro());
    }

    usuarioEsSupervisor() {
        return this.authService.getAuthorities().includes('ROLE_Supervisor');
    }

    private initForm(): void {
        this.form=this.formBuilder.group({
            desde: [null],
            hasta: [null],
            zona: [null],
            unidad: [null],
            supervisor: [null],
            estatus: [null],
            area: [null],
            departamento: [null],
        });
    }

    private cargarDatos(): void {
        forkJoin({
            unidades: this.unidadService.obtenerUnidades(),
            zonas: this.zonaService.obtenerZonas(),
            supervisores: this.supervisorService.obtenerEmpleados(AppConfig.ID_PUESTO_SUPERVISOR, AppConfig.ESTATUS_EMPLEADO_ACTIVO),
            estatus: this.estatusService.obtenerEstatus(), // areas: this.areaService.obtenerAreas(null),
            departamentos: this.departamentoService.obtenerDepartamentos(),
        })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (resultado) => {
                    this.unidades.set(resultado.unidades.data || []);
                    this.estatus.set(resultado.estatus.data || []);
                    this.zonas.set(resultado.zonas.data || []);

                    if(this.usuarioEsSupervisor()) {
                        this.unidades.set(resultado.unidades.data.filter((unidad) => unidad.supervisor.id == this.idUsuario));
                    } else {
                        this.supervisores.set(resultado.supervisores.data || []);
                    }
                    // this.areas.set(resultado.areas.data || []);
                    this.departamentos.set(resultado.departamentos.data || []);
                },
            });
    }

    private construirFiltro(): PropertiesFilter {
        const {desde, hasta, zona, unidad, supervisor, estatus, area, departamento}=this.form.value;

        return {
            desde: desde ? fechaISOString(desde) : null,
            hasta: hasta ? fechaISOString(obtenerFinDia(hasta)) : null,
            zonaId: zona?.id ?? null,
            unidadId: unidad?.id ?? null,
            supervisorId: supervisor?.id ?? null,
            estatusId: estatus?.id ?? null, // areaId: area?.id ?? null,
            departamentoGeneraId: departamento?.id ?? null,
            pagina: 0,
            filas: AppConfig.MAX_ROW_TABLE,
        };
    }
}
