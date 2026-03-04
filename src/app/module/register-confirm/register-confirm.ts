import {Component, inject, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {AccountRegistrationService} from '@/core/services/seguridad/AccountRegistrationService';

@Component({
    selector: 'app-register-confirm',
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './register-confirm.html',
    standalone: true,
})
export class RegisterConfirmComponent implements OnInit {
    route=inject(ActivatedRoute);
    router=inject(Router);
    registrationService=inject(AccountRegistrationService);
    token='';
    isValidToken=false;
    isValidating=true;
    error='';
    success=false;
    isLoading=false;
    form=new FormGroup({
        username: new FormControl('', [Validators.required, Validators.minLength(4)]),
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
        this.registrationService.validateToken(this.token).subscribe({
            next: (res) => {
                this.isValidToken=true;
                this.isValidating=false;
            }, error: (err) => {
                this.isValidToken=false;
                this.error=err.error?.message || 'El enlace es inválido o ha expirado.';
                this.isValidating=false;
            },
        });
    }

    onSubmit() {
        if(this.form.invalid) return;
        const {username, password, confirmPassword}=this.form.value;
        if(password !== confirmPassword) {
            this.error='Las contraseñas no coinciden.';
            return;
        }
        this.isLoading=true;
        this.error='';
        this.registrationService.completeRegistration(this.token, username as string, password as string)
            .subscribe({
                next: (res) => {
                    this.success=true;
                    this.isLoading=false;
                }, error: (err) => {
                    this.error=err.error?.error || 'Error al crear la cuenta.';
                    this.isLoading=false;
                },
            });
    }
}
