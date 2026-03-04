import {Injectable, signal} from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class SpinnerService {
    private _isLoading=signal(false);
    public isLoading=this._isLoading.asReadonly();

    show(): void {
        this._isLoading.set(true);
    }

    hide(): void {
        this._isLoading.set(false);
    }
}
