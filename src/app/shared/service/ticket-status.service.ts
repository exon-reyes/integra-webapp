import {Injectable} from '@angular/core';
import {ObjectEvent} from '@/shared/util/object.event';

export enum EVENTO_TICKET {
    NUEVO_SEGUIMIENTO
}

@Injectable({
    providedIn: 'root',
})
export class TicketStatusService extends ObjectEvent<EVENTO_TICKET, void> {
    constructor() {
        super();
    }
}
