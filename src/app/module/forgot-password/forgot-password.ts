import {ChangeDetectionStrategy, Component, DestroyRef, inject, signal} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {NgOptimizedImage} from '@angular/common';

import {PasswordResetService} from '@/core/services/seguridad/PasswordResetService';
import {Button} from "primeng/button";
import {AlertComponent} from "@/components/alert";
import {InputText} from "primeng/inputtext";

@Component({
    selector: 'app-forgot-password',
    imports: [ReactiveFormsModule, RouterLink, NgOptimizedImage, Button, AlertComponent, InputText],
    templateUrl: './forgot-password.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {

    // UI State
    readonly isLoading=signal(false);
    readonly submitted=signal(false);
    readonly message=signal('');
    readonly error=signal('');
    private readonly fb=inject(NonNullableFormBuilder);
    readonly form=this.fb.group({
        username: ['', Validators.required],
    });
    private readonly resetService=inject(PasswordResetService);
    private readonly destroyRef=inject(DestroyRef);

    onSubmit(): void {
        if(this.form.invalid || this.isLoading()) {
            this.form.markAllAsTouched();
            return;
        }

        this.isLoading.set(true);
        this.error.set('');

        const {username}=this.form.getRawValue();

        this.resetService.requestReset(username)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.submitted.set(true);
                    this.message.set(
                        response?.message ??
                        'Si la cuenta existe, recibirá un correo con instrucciones.',
                    );
                    this.isLoading.set(false);
                },
                error: (err) => {
                    this.error.set(err.error.detail);
                    this.isLoading.set(false);
                },
            });
    }
}
