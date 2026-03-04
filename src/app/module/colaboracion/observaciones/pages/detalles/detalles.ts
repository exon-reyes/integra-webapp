// import {Component, inject, OnInit} from '@angular/core';
// import {ActivatedRoute} from '@angular/router';
// import {Toolbar} from 'primeng/toolbar';
// import {Button} from 'primeng/button';
// import {Panel} from 'primeng/panel';
// import {MenuItem} from 'primeng/api';
// import {FileUpload} from 'primeng/fileupload';
// import {SplitButton} from 'primeng/splitbutton';
// import {Dialog} from 'primeng/dialog';
// import {ObservacionService} from '@/core/services/observacion/ObservacionService';
// import {Observacion} from '@/models/observacion/observacion';
// import {Origen} from "@/module/colaboracion/observaciones/pages/detalles/components/origen/origen";
// import {
//     Responsabilidad
// } from "@/module/colaboracion/observaciones/pages/detalles/components/responsabilidad/responsabilidad";
// import {HistorialComponent} from "@/module/colaboracion/observaciones/pages/detalles/components/historial/historial";
// import {Estatus} from "@/config/base.config";
//
// @Component({
//     selector: 'app-detalles',
//     imports: [Toolbar, Button, Panel, FileUpload, SplitButton, Dialog, Origen, Responsabilidad, HistorialComponent],
//     templateUrl: './detalles.html',
//     styleUrl: './detalles.scss'
// })
// export class Detalles implements OnInit {
//     observacion: Observacion | null = null;
//     statusMenuItems: MenuItem[] = [];
//     observacionId: number = 0;
//     mostrarHistorial: boolean = false;
//     private observacionService = inject(ObservacionService);
//     private route = inject(ActivatedRoute);
//
//     ngOnInit() {
//         this.observacionId = +this.route.snapshot.params['id'];
//         this.cargarObservacion();
//         this.initStatusMenu();
//     }
//
//     cambiarEstado(idEstatus: number) {
//         this.observacionService.actualizarEstado(this.observacionId, idEstatus).subscribe({
//             next: () => {
//                 console.log('Archivo actualizado correctamente');
//                 this.cargarObservacion();
//             }
//         });
//     }
//
//     onUpload(event: any) {
//         const file = event.files[0];
//         this.observacionService.subirAdjunto(this.observacionId, file).subscribe({
//             next: () => {
//
//                 this.cargarObservacion();
//             }
//         });
//     }
//
//     private cargarObservacion() {
//         this.observacionService.obtenerInfoDetallesPorId(this.observacionId).subscribe({
//             next: (response) => {
//                 this.observacion = response.data;
//             }
//         });
//     }
//
//     private initStatusMenu() {
//         this.statusMenuItems = [
//             {
//                 label: 'Pendiente',
//                 icon: 'pi pi-clock', // Representa espera/pendiente
//                 command: () => this.cambiarEstado(Estatus.Pendiente)
//             },
//             {
//                 label: 'Cerrado',
//                 icon: 'pi pi-check-circle', // Indica finalizado / cerrado correctamente
//                 command: () => this.cambiarEstado(Estatus.Cerrado)
//             },
//             {
//                 label: 'Abierto',
//                 icon: 'pi pi-play', // Inicio / en curso
//                 command: () => this.cambiarEstado(Estatus.Abierto)
//             },
//             {
//                 separator: true
//             },
//             {
//                 label: 'Resuelto',
//                 icon: 'pi pi-check-square', // Problema solucionado
//                 command: () => this.cambiarEstado(Estatus.Resuelto)
//             },
//             {
//                 label: 'Cancelado',
//                 icon: 'pi pi-times-circle', // Cancelado / anulado
//                 command: () => this.cambiarEstado(Estatus.Cancelado)
//             }
//         ];
//     }
//
// }
