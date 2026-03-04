import {Injectable} from '@angular/core';
import {FormGroup} from '@angular/forms';

@Injectable()
export class FormValidatorService {
    constructor() {
    }

    marcarFormulario(form: FormGroup): void {
        Object.values(form.controls).forEach((control) => {
            control.markAsTouched();
        });
    }
}
