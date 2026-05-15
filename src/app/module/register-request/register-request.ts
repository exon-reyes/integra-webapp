import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AccountRegistrationService} from '@/core/services/seguridad/AccountRegistrationService';
import {RouterLink} from '@angular/router';
import {NgOptimizedImage} from "@angular/common";
import {Button} from "primeng/button";
import {isControlInvalid} from "@/shared/util/form-validator";
import {Message} from "primeng/message";
import {InputText} from "primeng/inputtext";
import {AlertComponent} from "@/components/alert";

@Component({
    selector: 'app-register-request',
    imports: [ReactiveFormsModule, RouterLink, NgOptimizedImage, Button, Message, InputText, AlertComponent],
    templateUrl: './register-request.html',
    standalone: true,
})
export class RegisterRequestComponent {
    registrationService=inject(AccountRegistrationService);
    form=new FormGroup({
        employeeCode: new FormControl('', [Validators.required]),
    });
    isLoading=false;
    message='';
    error='';
    submitted=false;
    protected readonly isControlInvalid=isControlInvalid;

    onSubmit() {
        if(this.form.invalid) return;
        this.isLoading=true;
        this.message='';
        this.error='';
        this.registrationService.requestRegistration(this.form.value.employeeCode as string)
            .subscribe({
                next: (res) => {
                    this.isLoading=false;
                    this.submitted=true;
                    this.message=res.message || 'Si el código es válido, recibirás un correo con las instrucciones.';
                }, error: (err) => {
                    this.isLoading=false;
                    this.error=err.error.message;
                },
            });
    }
}
