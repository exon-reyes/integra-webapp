import {Component, inject, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {PasswordResetService} from '@/core/services/seguridad/PasswordResetService';
import {NgOptimizedImage} from "@angular/common";

@Component({
    selector: 'app-reset-password',
    imports: [ReactiveFormsModule, RouterLink, NgOptimizedImage],
    templateUrl: './reset-password.html',
    standalone: true,
})
export class ResetPasswordComponent implements OnInit {
    route=inject(ActivatedRoute);
    router=inject(Router);
    resetService=inject(PasswordResetService);

    token='';
    isValidToken=false;
    isValidating=true;
    error='';
    success=false;
    isLoading=false;

    form=new FormGroup({
        password: new FormControl('', [Validators.required, Validators.minLength(6)]),
        confirmPassword: new FormControl('', [Validators.required]),
    });

    ngOnInit() {
        this.token=this.route.snapshot.queryParamMap.get('token') || '';
        if(!this.token) {
            this.error='Token no proporcionado.';
            this.isValidating=false;
            return;
        }

        this.resetService.validateToken(this.token).subscribe({
            next: (res) => {
                this.isValidToken=true;
                this.isValidating=false;
            },
            error: (err) => {
                this.isValidToken=false;
                this.error=err.error?.message || 'El enlace es inválido o ha expirado.';
                this.isValidating=false;
            },
        });
    }

    onSubmit() {
        if(this.form.invalid) return;

        const {password, confirmPassword}=this.form.value;
        if(password !== confirmPassword) {
            this.error='Las contraseñas no coinciden.';
            return;
        }

        this.isLoading=true;
        this.error='';

        this.resetService.resetPassword(this.token, password as string).subscribe({
            next: (res) => {
                this.success=true;
                this.isLoading=false;
                setTimeout(() => this.router.navigate(['/auth/login']), 3000);
            },
            error: (err) => {
                this.error=err.error?.error || 'Error al restablecer contraseña.';
                this.isLoading=false;
            },
        });
    }
}
