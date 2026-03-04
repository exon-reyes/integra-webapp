// import { Component, inject, OnInit } from '@angular/core';
// import { TitleComponent } from '@/shared/component/title/title.component';
// import { Menubar } from 'primeng/menubar';
// import { MenuItem, MessageService } from 'primeng/api';
// import { TableModule } from 'primeng/table';
// import { Page } from '@/shared/util/page';
// import { Ticket } from '@/models/reporte/ticket';
// import { Subject, takeUntil } from 'rxjs';
// import { FiltroTicketService } from '@/core/filters/filtro-ticket.service';
// import { FiltroPersonalizadoService } from '@/core/filters/filtro-personalizado.service';
// import { TicketService } from '@/core/services/reporte/ticket.service';
// import { EstatusColorService } from '@/shared/service/estatus-color.service';
// import { LoginService } from '@/core/services/auth/LoginService';
// import { buildCopyString } from '@/module/reporte/util/ReporteUtil';
// import { Paginator, PaginatorState } from 'primeng/paginator';
// import { ObservacionService } from '@/core/services/observacion/ObservacionService';
// import { Observacion } from '@/models/observacion/observacion';
// import { Button } from 'primeng/button';
// import { CopyComponent } from '@/shared/component/copy/copy.component';
// import { DatePipe, NgClass } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { HasPermissionDirective } from '@/shared/directive/has-permission.directive';
// import { IconField } from 'primeng/iconfield';
// import { InputIcon } from 'primeng/inputicon';
// import { InputText } from 'primeng/inputtext';
// import { SpinnerComponent } from '@/shared/component/spinner.component';
// import { RouterLink } from '@angular/router';
// import {BuscarFolioComponent} from "@/module/reporte/component/buscar-folio/buscar-folio.component";
// import {
//     FiltroPersonalizadoComponent
// } from "@/module/reporte/component/filtro-personalizado/filtro-personalizado.component";
//
// @Component({
//     selector: 'app-panel',
//     imports: [TitleComponent, Menubar, TableModule, Button, CopyComponent, DatePipe, FormsModule, HasPermissionDirective, IconField, InputIcon, InputText, Paginator, SpinnerComponent, NgClass, RouterLink, BuscarFolioComponent, FiltroPersonalizadoComponent],
//     templateUrl: './panel.html',
//     styleUrl: './panel.scss'
// })
// export class Panel implements OnInit {
//     protected searchTicketStatus: boolean;
//     protected openFilter: boolean;
//     protected openCustomFilter: boolean;
//     protected activeFilter: boolean;
//     protected addSeguimiento: boolean;
//     protected items: MenuItem[] | undefined;
//     protected observaciones: Observacion[] = [];
//     protected pagina = new Page();
//     protected searchValue = '';
//     protected selectedTicket: Ticket;
//     protected readonly buildCopyString = buildCopyString;
//     private idDepartamentoGenera: number;
//     private unsubscribe$ = new Subject<void>();
//     private propTicketFilter = inject(FiltroTicketService);
//     private customFilterService = inject(FiltroPersonalizadoService);
//     private notificacionService = inject(MessageService);
//     private ticketService = inject(TicketService);
//     private estatusService = inject(EstatusColorService);
//     private authService = inject(LoginService);
//     private observacionService = inject(ObservacionService);
//     obtenerGravedad(statusId: number): string {
//         return this.estatusService.getClass(statusId);
//     }
//     ngOnInit(): void {
//         this.idDepartamentoGenera = this.authService.getDepartmentId();
//         this.items = this.buildMenuItems();
//
//         this.pagina.reset();
//         this.propTicketFilter.reset();
//         this.eventoFiltro();
//         this.cargarObservaciones();
//     }
//
//     cargarObservaciones() {
//         this.pagina.loading = true;
//         let params = this.propTicketFilter.build();
//         params.departamentoResponsableId = this.idDepartamentoGenera;
//         if (this.esSupervisor()) {
//             params.supervisorId = this.authService.getUserId();
//         }
//         // params.departamento = this.ID_DEPARTAMENTO;
//         this.observacionService
//             .obtenerPorFiltro(params)
//             .pipe(takeUntil(this.unsubscribe$))
//             .subscribe({
//                 next: (response) => {
//                     this.observaciones = response.data || [];
//                     this.pagina.change(false, response.meta['totalItems']);
//                 },
//                 error: (err) => {
//                     console.error(err);
//                     this.pagina.loading = false;
//                 }
//             });
//     }
//
//     eventoFiltro() {
//         this.customFilterService.subject.pipe(takeUntil(this.unsubscribe$)).subscribe({
//             next: (value) => {
//                 if (value.key === 'APLICAR_FILTROS') {
//                     this.activeFilter = true;
//                     this.cargarTicketsConFiltroPersonalizado();
//                 } else if (value.key === 'LIMPIAR_FILTROS') {
//                     this.activeFilter = false;
//                     this.cargarTicketsConFiltroPersonalizado();
//                 }
//             }
//         });
//     }
//
//     onPageChange($event: PaginatorState) {
//         this.pagina.changePage($event.first, $event.rows);
//         this.propTicketFilter.asignarPagina($event.page, this.pagina.rows);
//         this.cargarObservaciones();
//     }
//
//     openModalSeguimiento(ticket: Ticket) {
//         this.selectedTicket = ticket;
//         this.addSeguimiento = true;
//     }
//
//     cargarTicketsConFiltroPersonalizado() {
//         this.pagina.loading = true;
//         let params = this.customFilterService.build();
//         params.idDepartamentoGenera = this.idDepartamentoGenera;
//         params.idDepartamentoDestino = this.idDepartamentoGenera;
//         if (this.esSupervisor()) {
//             params.supervisorId = this.authService.getUserId();
//         }
//
//         this.observacionService
//             .obtenerPorFiltro(params)
//             .pipe(takeUntil(this.unsubscribe$))
//             .subscribe({
//                 next: (response) => {
//                     this.observaciones = response.data || [];
//                     this.pagina.change(false, response.meta['totalItems']);
//                 },
//                 error: (err) => {
//                     console.error(err);
//                     this.pagina.loading = false;
//                 }
//             });
//     }
//
//     onCustomFilterApplied() {
//         this.openCustomFilter = false;
//         this.pagina.reset();
//     }
//
//     actualizarTabla() {
//         this.pagina.reset();
//         this.activeFilter = false;
//         this.propTicketFilter.reset();
//         this.customFilterService.reset();
//         this.cargarObservaciones();
//     }
//
//     onBuscarFolio(folio: string) {
//         this.searchTicketStatus = false;
//         this.activeFilter = true;
//         this.propTicketFilter.reset();
//         this.propTicketFilter.updateFolio(folio);
//         this.pagina.reset();
//         this.cargarObservaciones();
//     }
//
//     protected otroDepartamentoGenera(idDepartamentoGenera: number): boolean {
//         return idDepartamentoGenera != this.idDepartamentoGenera;
//     }
//
//     private esSupervisor() {
//         return this.authService.hasAuthority('ROLE_Supervisor');
//     }
//
//     private buildMenuItems(): MenuItem[] {
//         const items: MenuItem[] = [];
//
//         if (this.authService.hasAuthority('TKT_C')) {
//             items.push({ label: 'Nuevo', icon: 'pi pi-plus', routerLink: 'ticket/add' });
//         }
//
//         items.push({
//             label: 'Buscar folio',
//             icon: 'pi pi-ticket',
//             command: () => (this.searchTicketStatus = true)
//         });
//         items.push({
//             label: 'Filtros personalizados',
//             icon: 'pi pi-sliders-h',
//             command: () => (this.openCustomFilter = true)
//         });
//         // if (this.authService.hasAuthority('TICKET_FILTER')) {
//         //
//         // }
//
//         items.push({
//             label: 'Actualizar tabla',
//             icon: 'pi pi-refresh',
//             command: () => this.actualizarTabla()
//         });
//
//         return items;
//     }
// }
