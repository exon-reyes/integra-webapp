import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {finalize, Subject, takeUntil} from 'rxjs';
import {Router, RouterLink} from '@angular/router';
import {JWTService} from '@/core/security/JWTService';
import {LoginService} from '@/core/services/seguridad/LoginService';
import {NgOptimizedImage} from "@angular/common";
import {Button} from "primeng/button";
import {AlertComponent} from "@/components/alert";
import {InputText} from "primeng/inputtext";
import {Password} from "primeng/password";
import {Message} from "primeng/message";
import {isControlInvalid} from "@/shared/util/form-validator";

interface LoginForm {
    username: string;
    password: string;
}

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        ReactiveFormsModule, RouterLink, NgOptimizedImage, Button, AlertComponent, InputText, Password, Message,
    ],
    templateUrl: './login.html',
    styleUrl: './login.scss',
})
export class Login implements OnInit,
                              OnDestroy {
    // <-- Implementa OnDestroy
    loginForm: FormGroup;
    jwtService=inject(JWTService);
    isLoading=false;
    errorMessage='';
    showError=false;
    submitted=false; // Add submitted property
    protected readonly isControlInvalid=isControlInvalid;
    private loginService=inject(LoginService);
    // Creamos un Subject que actuará como señal para desuscribirnos
    private destroy$=new Subject<void>();

    constructor(private router: Router) {
    }

    ngOnInit(): void {
        // Si ya existe un token y no ha expirado, redirige al dashboard
        const token=this.jwtService.getToken();

        if(token && !this.jwtService.isTokenExpired(token)) {
            this.router.navigate(['/integra']);
            return;
        }

        this.loginForm=new FormGroup({
            username: new FormControl(null, [Validators.required]),
            password: new FormControl(null, [Validators.required, Validators.minLength(6)]),
        });
    }

    onSubmit() {
        this.submitted=true;
        if(this.loginForm.valid) {
            this.isLoading=true;
            this.showError=false;

            this.loginService
                .login(this.loginForm.value)
                .pipe(takeUntil(this.destroy$), finalize(() => {
                    this.isLoading=false;
                }))
                .subscribe({
                    next: (response) => {
                        this.showError=false;
                        this.loginForm.reset();
                        this.router.navigate(['/integra']);
                    }, error: (error) => {
                        this.showError=true;
                        if(error.status === 401) {
                            this.errorMessage='Credenciales inválidas. Verifica tu usuario y contraseña.';
                        } else if(error.status === 403) {
                            this.errorMessage='Acceso denegado. Tus credenciales han sido revocadas.';
                        } else if(error.status === 423) {
                            this.errorMessage='Cuenta bloqueada. Contacta al administrador.';
                        } else {
                            this.errorMessage='Error de conexión. Inténtalo más tarde'
                        }
                    },
                });
        }
    }

    // Hook del ciclo de vida que se ejecuta justo antes de que el componente sea destruido
    ngOnDestroy(): void {
        // Emitimos un valor para que takeUntil desuscriba todas las suscripciones
        this.destroy$.next();
        // Completamos el Subject para liberar los recursos
        this.destroy$.complete();
    }
}
