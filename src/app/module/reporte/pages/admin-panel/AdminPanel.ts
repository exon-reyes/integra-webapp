// import { Component, inject, OnInit } from '@angular/core';
// import { Menubar } from 'primeng/menubar';
// import { Button } from 'primeng/button';
// import { MenuItem, MessageService } from 'primeng/api';
// import { TitleComponent } from '@/shared/component/title/title.component';
// import { TableModule } from 'primeng/table';
// import { InputText } from 'primeng/inputtext';
// import { IconField } from 'primeng/iconfield';
// import { InputIcon } from 'primeng/inputicon';
// import { Paginator, PaginatorState } from 'primeng/paginator';
// import {
//     FiltroPersonalizadoComponent
// } from '@/module/reporte/component/filtro-personalizado/filtro-personalizado.component';
// import { FiltroPersonalizadoService } from '@/core/filters/filtro-personalizado.service';
// import { BuscarFolioComponent } from '@/module/reporte/component/buscar-folio/buscar-folio.component';
// import { HasPermissionDirective } from '@/shared/directive/has-permission.directive';
// import { DatePipe, NgClass } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { RouterLink } from '@angular/router';
// import { SpinnerComponent } from '@/shared/component/spinner.component';
// import { RegistrarActividadComponent } from '@/module/reporte/pages/registrar-actividad/registrar-actividad.component';
// import { CopyComponent } from '@/shared/component/copy/copy.component';
// import { Ticket } from '@/models/reporte/ticket';
// import { buildCopyString } from '@/module/reporte/util/ReporteUtil';
// import { FiltroTicketService } from '@/core/filters/filtro-ticket.service';
// import { Subject, takeUntil } from 'rxjs';
// import { Page } from '@/shared/util/page';
// import { TicketService } from '@/core/services/reporte/ticket.service';
// import { EstatusColorService } from '@/shared/service/estatus-color.service';
//
//
// @Component({
//     selector: 'app-ticket-admin',
//     imports: [Menubar, Button, TitleComponent, TableModule, InputText, IconField, InputIcon, Paginator, FiltroPersonalizadoComponent, BuscarFolioComponent, DatePipe, FormsModule, NgClass, RouterLink, SpinnerComponent, RegistrarActividadComponent, CopyComponent, HasPermissionDirective],
//     templateUrl: './AdminPanel.html',
//     standalone: true,
//     styleUrl: './AdminPanel.scss'
// })
// export class AdminPanel implements OnInit {
//     // private ID_DEPARTAMENTO = 4;
//     protected searchTicketStatus: boolean;
//     protected openFilter: boolean;
//     protected openCustomFilter: boolean;
//     protected activeFilter: boolean;
//     protected addSeguimiento: boolean;
//     protected items: MenuItem[] | undefined;
//     protected tickets: Ticket[] = [];
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
//         this.cargarTickets();
//     }
//
//     cargarTickets() {
//         this.pagina.loading = true;
//         let params = this.propTicketFilter.build();
//         params.idDepartamentoGenera = this.idDepartamentoGenera;
//         params.idDepartamentoDestino = this.idDepartamentoGenera;
//         if (this.esSupervisor()) {
//             params.supervisorId = this.authService.getUserId();
//         }
//         // params.departamento = this.ID_DEPARTAMENTO;
//         this.ticketService
//             .obtenerGenerales(params)
//             .pipe(takeUntil(this.unsubscribe$))
//             .subscribe({
//                 next: (response) => {
//                     this.tickets = response.data || [];
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
//         this.cargarTickets();
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
//         this.ticketService
//             .obtenerGenerales(params)
//             .pipe(takeUntil(this.unsubscribe$))
//             .subscribe({
//                 next: (response) => {
//                     this.tickets = response.data || [];
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
//         this.cargarTickets();
//     }
//
//     onBuscarFolio(folio: string) {
//         this.searchTicketStatus = false;
//         this.activeFilter = true;
//         this.propTicketFilter.reset();
//         this.propTicketFilter.updateFolio(folio)
//         this.pagina.reset();
//         this.cargarTickets();
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
//             command: () => this.searchTicketStatus = true
//         });
//         items.push({
//             label: 'Filtros personalizados',
//             icon: 'pi pi-sliders-h',
//             command: () => this.openCustomFilter = true
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
