import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {KioscoConfigService} from '../service/kiosco-config-service';
import {TableModule} from 'primeng/table';
import {ButtonModule} from 'primeng/button';
import {Title} from '@/components/title';
import {MessageService} from 'primeng/api';
import {Unidad} from '@/models/empresa/unidad';
import {FormsModule} from '@angular/forms';
import {IconField} from 'primeng/iconfield';
import {InputIcon} from 'primeng/inputicon';
import {InputText} from 'primeng/inputtext';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from "primeng/tabs";
import {JWTService} from "@/core/security/JWTService";
import {Autoridades} from "@/core/Autoridades";
import {Panel} from "primeng/panel";
import {Tooltip} from "primeng/tooltip";
import {StateComponent} from "@/components/state.component";
import {ClipboardService} from "@/shared/service/clipboard.service";
import {Dialog} from "primeng/dialog";
import {StatWidgetComponent} from "@/components/stat-widget";

@Component({
    selector: 'app-admin-kiosco',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        ButtonModule,
        Title,
        FormsModule,
        IconField,
        InputIcon,
        InputText,
        TabPanel,
        Tabs,
        TabList,
        Tab,
        TabPanels,
        Panel,
        Tooltip,
        StateComponent,
        Dialog,
        StatWidgetComponent,
    ],
    templateUrl: './admin-kiosco.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './admin-kiosco.scss',
})
export class AdminKiosco implements OnInit {
    kioscos=signal<Unidad[]>([]);
    loading=signal(false);
    editandoCompensacion=signal<number | null>(null);
    tiempoCompensacionTemp=signal<string>('');
    horasTemp=signal<number>(0);
    minutosTemp=signal<number>(0);
    kioscosConCamara=computed(() => this.kioscos().filter((k) => k.requiereCamara).length);
    kioscosSinCamara=computed(() => this.kioscos().filter((k) => !k.requiereCamara).length);
    porcentajeConCamara=computed(() => {
        const total=this.kioscos().length;
        if(total === 0) return 0;
        return Math.round((this.kioscosConCamara() / total) * 100);
    });
    kioscosConCompensacion=computed(() => this.kioscos().filter((k) => k.tiempoCompensacion && k.tiempoCompensacion !== '00:00:00').length);
    kioscosSolicitudes=computed(() => this.kioscos().filter((k) => k.requiereReset));
    kioscosAprobados=computed(() => this.kioscos().filter((k) => k.codigoAutorizacionKiosco && !k.requiereReset));
    mostrarDialogoTiempo=signal(false);
    tiempoCapturaFotoKiosco=signal<number>(5);
    protected urlRelojChecador="https://sci.ddns.me:4200/integra/checador";
    protected tiempoTemp: number;
    private kioscoService=inject(KioscoConfigService);
    private readonly messageService=inject(MessageService);
    private readonly securityService=inject(JWTService);
    private readonly clipboardService=inject(ClipboardService)

    get puedeConfigurarCompensacion(): boolean {
        return this.securityService.hasAuthority(Autoridades.CONFIG_RELOJ_EDITAR_TIEMPOS)
    }

    get puedeCambiarEstatusCamara(): boolean {
        return this.securityService.hasAuthority(Autoridades.CONFIG_RELOJ_ACTIVAR_CAMARA)
    }

    get puedeAprobarSolicitudes(): boolean {
        return this.securityService.hasAuthority(Autoridades.CONFIG_RELOJ_APROBAR_PERSONALIZADA)

    }

    get puedeVisualizarTokens(): boolean {
        return this.securityService.hasAuthority(Autoridades.CONFIG_RELOJ_VER_TOKENS)
    }

    ngOnInit() {
        this.cargarKioscos();
        this.obtenerConfigTiempoGlobalCamara()
    }

    cargarKioscos() {
        this.loading.set(true);
        this.kioscoService.obtenerUnidadesKiosco().subscribe({
            next: (data) => {
                this.kioscos.set(data.data);
                this.loading.set(false);
            }, error: (error) => {
                this.messageService.add({
                    severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los kioscos',
                });
                this.loading.set(false);
            },
        });
    }

    actualizarEstatusCamara(kiosco: Unidad) {
        const nuevoValor=!kiosco.requiereCamara;
        this.kioscoService.actualizarUsoCamara(kiosco.id, nuevoValor).subscribe({
            next: (response) => {
                if(response.success) {
                    this.kioscos.update((kioscos) => kioscos.map((k) => (k.id === kiosco.id ? {
                        ...k, requiereCamara: nuevoValor,
                    } : k)));
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: `Cámara ${nuevoValor ? 'activada' : 'desactivada'} correctamente`,
                    });
                }
            }, error: (error) => {
                this.messageService.add({
                    severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la configuración',
                });
            },
        });
    }

    generarCodigoConfig(kiosco: Unidad) {
        this.kioscoService.generarCodigoConfigUnSoloUso(kiosco.id).subscribe({
            next: (response) => {
                if(response.success) {
                    this.kioscos.update((kioscos) => kioscos.map((k) => (k.id === kiosco.id ? {
                        ...k, requiereReset: false, codigoAutorizacionKiosco: response.data,
                    } : k)));
                    this.messageService.add({
                        severity: 'success', summary: 'Reset Aprobado', detail: `Código generado: ${response.data}`,
                    });
                }
            }, error: (error) => {
                this.messageService.add({
                    severity: 'error', summary: 'Error', detail: 'No se pudo aprobar el reset',
                });
            },
        });
    }

    rechazarSolicitudCodigo(kiosco: Unidad) {
        this.kioscoService.cancelarCodigo(kiosco.id).subscribe({
            next: (response) => {
                if(response.success) {
                    this.kioscos.update((kioscos) => kioscos.map((k) => (k.id === kiosco.id ? {
                        ...k, requiereReset: false,
                    } : k)));
                    this.messageService.add({
                        severity: 'info', summary: 'Configuración manual rechazada',
                    });
                }
            }, error: (error) => {
                this.messageService.add({
                    severity: 'error', summary: 'Error', detail: 'No se pudo rechazar la solicitud',
                });
            },
        });
    }

    iniciarEdicionCompensacion(kiosco: Unidad) {
        this.editandoCompensacion.set(kiosco.id);
        const tiempo=kiosco.tiempoCompensacion || '00:00';
        const [horas, minutos]=tiempo.split(':').map(Number);
        this.horasTemp.set(horas);
        this.minutosTemp.set(minutos);
        this.tiempoCompensacionTemp.set(tiempo);
    }

    cancelarEdicionCompensacion() {
        this.editandoCompensacion.set(null);
        this.tiempoCompensacionTemp.set('');
        this.horasTemp.set(0);
        this.minutosTemp.set(0);
    }

    guardarCompensacion(kiosco: Unidad) {
        const horas=this.horasTemp().toString().padStart(2, '0');
        const minutos=this.minutosTemp().toString().padStart(2, '0');
        const nuevoTiempo=`${horas}:${minutos}:00`;

        this.kioscoService.actualizarCompensacion(kiosco.id, nuevoTiempo).subscribe({
            next: (response) => {
                if(response.success) {
                    this.kioscos.update((kioscos) => kioscos.map((k) => (k.id === kiosco.id ? {
                        ...k, tiempoCompensacion: nuevoTiempo,
                    } : k)));
                    this.editandoCompensacion.set(null);
                    this.messageService.add({
                        severity: 'success', summary: 'Éxito', detail: 'Tiempo de compensación actualizado',
                    });
                }
            }, error: (error) => {
                this.messageService.add({
                    severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el tiempo de compensación',
                });
            },
        });
    }

    editarTiempo() {
        this.mostrarDialogoTiempo.set(true);
    }

    cerrarDialogoTiempo() {
        this.mostrarDialogoTiempo.set(false);
    }

    guardarTiempoFoto() {
        const tiempo=this.tiempoTemp
        if(tiempo>=3 && tiempo<=5) {
            this.kioscoService.actualizarTiempoCapturaFoto(tiempo).subscribe({
                next: v => {
                    if(v.success) {
                        this.tiempoCapturaFotoKiosco.set(tiempo)
                    }
                },
            })
            this.mostrarDialogoTiempo.set(false);
            this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: `Tiempo de captura actualizado a ${tiempo} segundos`,
            });
        } else {
            this.messageService.add({
                severity: 'error',
                summary: 'No se puede continuar',
                detail: 'El tiempo debe estar entre 3 y 5 segundos',
            });
        }
    }

    protected copiarUrl() {
        this.clipboardService.copy(this.urlRelojChecador)
    }

    protected copiarCodigo(nombreCompleto: string,
                           codigo: string) {
        this.clipboardService.copy(`= Código de conf. manual =\nUnidad: ${nombreCompleto}\nCódigo de un solo uso: ${codigo}`);
    }

    private obtenerConfigTiempoGlobalCamara() {
        this.kioscoService.obtenerTiempoCapturaFoto().subscribe({
            next: (response) => {
                if(response.success && response.data) {
                    this.tiempoCapturaFotoKiosco.set(response.data)
                }
            },
        });
    }
}
