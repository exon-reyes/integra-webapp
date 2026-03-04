import {Injectable, signal} from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class SearchStatusService {
    searching=signal<boolean>(false);

    constructor() {
    }

    state(status: boolean) {
        this.searching.set(status);
    }
}
