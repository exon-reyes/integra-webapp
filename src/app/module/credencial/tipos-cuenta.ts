import {Component, inject, OnInit, signal} from '@angular/core';
import {Button} from 'primeng/button';
import {InputText} from 'primeng/inputtext';
import {FormsModule} from '@angular/forms';
import {CredencialService, TipoCuenta} from './credencial.service';
import {ConfirmationService} from 'primeng/api';

@Component({
    selector: 'app-tipos-cuenta',
    standalone: true,
    imports: [Button, InputText, FormsModule],
    templateUrl: './tipos-cuenta.html',
    styleUrl: './tipos-cuenta.scss',
})
export class TiposCuenta implements OnInit {
    tiposCuenta=signal<TipoCuenta[]>([]);
    nombreTipo='';
    tipoEditando: TipoCuenta | null=null;
    loading=false;
    private credencialService=inject(CredencialService);
    private confirmationService=inject(ConfirmationService);

    get totalTipos() {
        return this.tiposCuenta().length;
    }

    ngOnInit() {
        this.loadTipos();
    }

    loadTipos() {
        this.credencialService.obtenerTipoCuentas().subscribe({
            next: (response) => {
                this.tiposCuenta.set(response.data);
            },
        });
    }

    editarTipo(tipo: TipoCuenta) {
        this.tipoEditando=tipo;
        this.nombreTipo=tipo.nombre;
    }

    guardarTipo() {
        if(!this.nombreTipo.trim()) return;

        this.loading=true;
        if(this.tipoEditando) {
            this.credencialService.actualizarTipoCuenta(this.tipoEditando.id, {nombre: this.nombreTipo}).subscribe({
                next: () => {
                    this.loadTipos();
                    this.cancelarEdicion();
                    this.loading=false;
                },
                error: (err) => {
                    console.error('Error actualizando tipo:', err);
                    this.loading=false;
                },
            });
        } else {
            this.credencialService.crearTipoCuenta({nombre: this.nombreTipo}).subscribe({
                next: () => {
                    this.loadTipos();
                    this.nombreTipo='';
                    this.loading=false;
                },
                error: (err) => {
                    console.error('Error registrando tipo:', err);
                    this.loading=false;
                },
            });
        }
    }

    cancelarEdicion() {
        this.tipoEditando=null;
        this.nombreTipo='';
    }

    eliminarTipo(tipo: TipoCuenta) {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar el tipo de cuenta "${tipo.nombre}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.credencialService.eliminarTipoCuenta(tipo.id).subscribe({
                    next: () => this.loadTipos(),
                });
            },
        });
    }
}
