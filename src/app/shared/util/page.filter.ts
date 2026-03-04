import {ObjectEvent} from '@/shared/util/object.event';
import {PropertiesFilter} from '@/shared/request/properties.filter';
import {AppConfig} from '@/config/base.config';
import {normalizeProperties} from '@/shared/util/object.util';

export class PageFilter<KEY> extends ObjectEvent<KEY, PropertiesFilter> {
    private TABLE_PROPERTIES: PropertiesFilter={pagina: 0, filas: 20};

    constructor() {
        super();
    }

    update(props: PropertiesFilter): void {
        this.TABLE_PROPERTIES=props;
    }

    reset() {
        this.TABLE_PROPERTIES={pagina: 0, filas: AppConfig.MAX_ROW_TABLE};
    }

    asignarPagina(page: number,
                  rows: number): void {
        this.TABLE_PROPERTIES.pagina=page;
        this.TABLE_PROPERTIES.filas=rows;
    }

    updateUnit(id: number) {
        this.TABLE_PROPERTIES.unidadId=id;
    }

    updateStatus(id: number) {
        this.TABLE_PROPERTIES.estatusId=id;
    }

    updateFolio(folio: string) {
        this.TABLE_PROPERTIES.folio=folio;
    }

    build() {
        this.TABLE_PROPERTIES=normalizeProperties<PropertiesFilter>(this.TABLE_PROPERTIES);
        return this.TABLE_PROPERTIES;
    }
}
