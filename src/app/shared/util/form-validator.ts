import { AbstractControl, FormGroup } from '@angular/forms';

export function isControlInvalid(form: FormGroup, controlName: string, submitted: boolean): boolean {
    const control: AbstractControl | null = form.get(controlName);
    if (!control) return false;
    return control.invalid && (control.touched || control.dirty || submitted);
}

export function getControlErrorMessage(form: FormGroup, controlName: string): string {
    const control = form.get(controlName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) {
        return 'Este campo es requerido';
    }
    if (control.errors['maxlength']) {
        const requiredLength = control.errors['maxlength'].requiredLength;
        return `El tamaño máximo es de ${requiredLength} caracteres`;
    }
    if (control.errors['email']) {
        return 'El formato del correo es inválido';
    }
    if (control.errors['minlength']) {
        const requiredLength = control.errors['minlength'].requiredLength;
        return `El tamaño mínimo es de ${requiredLength} caracteres`;
    }
    if (control.errors['pattern']) {
        return 'El formato es inválido';
    }

    return 'Valor inválido';
}
