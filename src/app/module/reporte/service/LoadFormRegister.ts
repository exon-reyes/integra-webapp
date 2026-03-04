import {finalize, map, Observable} from 'rxjs';
import {inject, signal, WritableSignal} from '@angular/core';
import {UnidadService} from '@/core/services/empresa/unidad.service';
import {AreaService} from '@/core/services/empresa/area.service';
import {EstatusService} from '@/core/services/reporte/estatus.service';
import {Unidad} from '@/models/empresa/unidad';
import {Area} from '@/models/area/area';
import {Estatus} from '@/models/reporte/estatus';
import {Reporte} from '@/models/reporte/reporte';

export class LoadFormRegister {
    private areaService: AreaService;
    private unidadService: UnidadService;
    private estatusService: EstatusService;

    constructor() {
        this.areaService=inject(AreaService);
        this.unidadService=inject(UnidadService);
        this.estatusService=inject(EstatusService);
        this.initData();
    }

    private _cargandoUnidades=signal<boolean>(false);

    get cargandoUnidades(): WritableSignal<boolean> {
        return this._cargandoUnidades;
    }

    private _cargandoAreas=signal<boolean>(false);

    get cargandoAreas(): WritableSignal<boolean> {
        return this._cargandoAreas;
    }

    private _cargandoEstatus=signal<boolean>(false);

    get cargandoEstatus(): WritableSignal<boolean> {
        return this._cargandoEstatus;
    }

    private _unidades$: Observable<Unidad[]>;

    get unidades$(): Observable<Unidad[]> {
        return this._unidades$;
    }

    private _areas$: Observable<Area[]>;

    get areas$(): Observable<Area[]> {
        return this._areas$;
    }

    private _estatus$: Observable<Estatus[]>;

    get estatus$(): Observable<Estatus[]> {
        return this._estatus$;
    }

    private _reportes=signal<Reporte[]>([]);

    get reportes(): WritableSignal<Reporte[]> {
        return this._reportes;
    }

    private initData() {
        this.cargandoUnidades.set(true);
        this.cargandoEstatus.set(true);
        this.cargandoAreas.set(true);

        this._unidades$=this.unidadService.obtenerUnidades().pipe(
            map((response) => response.data),
            finalize(() => this.cargandoUnidades.set(false)),
        );
        this._areas$=this.areaService.obtenerAreas({reportes: true}).pipe(
            map((response) => response.data),
            finalize(() => this.cargandoAreas.set(false)),
        );
        this._estatus$=this.estatusService.obtenerEstatus().pipe(
            map((response) => response.data),
            finalize(() => this.cargandoEstatus.set(false)),
        );
    }
}
