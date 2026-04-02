import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {DatePipe, NgClass, NgStyle} from "@angular/common";
import {Dialog} from "primeng/dialog";
import {Button} from "primeng/button";
import {
    DashboardGestionSolicitudResponse,
    DiaSolicitado,
    GestionSolicitudResponse,
    SolicitudGestion
} from "@/modules/vacacion/models/vacacion.model";
import {VacacionAdminService} from "@/modules/vacacion/services/vacacion.service";
import {Title} from "@/components/title";
import {TableModule} from "primeng/table";
import {Tab, TabList, TabPanel, TabPanels, Tabs} from "primeng/tabs";
import {SelectButtonModule} from 'primeng/selectbutton';
import {Panel} from "primeng/panel";

// Tipos para el formato aplanado de la vista
export interface FlatRequest {
    emp: GestionSolicitudResponse;
    req: SolicitudGestion;
}

@Component({
    selector: 'app-autorizacion', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, imports: [
        FormsModule,
        Title,
        Dialog,
        NgClass,
        NgStyle,
        TabPanel,
        DatePipe,
        TableModule,
        TabPanels,
        Tab,
        TabList,
        Button,
        Tabs,
        SelectButtonModule,
        Panel
    ], templateUrl: './autorizacion.html', styleUrl: './autorizacion.scss'
})
export class Autorizacion implements OnInit {
    dashboardIndicador: DashboardGestionSolicitudResponse={
        totalSolicitudes: 0, solicitudesPendientes: 0, solicitudesAprobadas: 0, solicitudesRechazadas: 0, empleados: []
    };
    filterOptions=[
        {label: 'Todas', value: 'all'},
        {label: 'Pendiente', value: 'PENDIENTE'},
        {label: 'Aprobada', value: 'APROBADA'},
        {label: 'Rechazada', value: 'RECHAZADA'}
    ];
    // Estado principal
    empleados=signal<GestionSolicitudResponse[]>([]);
    // Controles de Vistas y Filtros
    view=signal<'dashboard' | 'requests' | 'employees'>('requests');
    statusFilter=signal<string>('PENDIENTE');
    searchQuery=signal<string>('');
    // Controles de Modal
    visibleDialog=signal<boolean>(false);
    visibleEmpDialog=signal<boolean>(false);
    selectedRequest=signal<FlatRequest | null>(null);
    selectedEmp=signal<GestionSolicitudResponse | null>(null);
    // Fecha simulada para lógicas del dashboard (como en tu plantilla)
    SIMULATED_TODAY=new Date('2026-03-24'); // Actulizado a hoy para que coincida con tus validaciones si las hay
    SIMULATED_YEAR=2026;
    // Aplanar las solicitudes para la lista general
    solicitudesPlanas=computed<FlatRequest[]>(() => {
        const list: FlatRequest[]=[];
        for(let emp of this.empleados()) {
            for(let req of emp.solicitudes || []) {
                list.push({emp, req});
            }
        }
        // Orden estático por folio por defecto
        return list.sort((a,
                          b) => b.req.folio - a.req.folio);
    });

    // --- Computed Signals ---
    filteredRequests=computed<FlatRequest[]>(() => {
        let list=this.solicitudesPlanas();
        const filter=this.statusFilter();
        const sq=this.searchQuery().toLowerCase().trim();

        if(filter !== 'all') {
            list=list.filter(item => item.req.estatus?.toUpperCase() === filter.toUpperCase());
        }
        if(sq) {
            list=list.filter(item => item.emp.nombreCompleto.toLowerCase().includes(sq));
        }
        return list;
    });
    pendingCount=computed(() => {
        return this.solicitudesPlanas().filter(r => r.req.estatus?.toUpperCase() === 'PENDIENTE' || r.req.estatus?.toUpperCase() === 'EN_REVISION').length;
    });
    private readonly vacacionAdminService=inject(VacacionAdminService);

    ngOnInit(): void {
        this.vacacionAdminService.getDashboardGestionIndicadores().subscribe({
            next: (response) => {
                if(response.success && response.data) {
                    this.dashboardIndicador=response.data
                }
            }, error: (err) => console.error('Error fetching dashboard data', err)
        });
        this.vacacionAdminService.getSolicitudesGestion().subscribe({
            next: (response) => {
                if(response.success && response.data) {
                    this.empleados.set(response.data);
                }
            }, error: (err) => console.error('Error fetching solicitudes', err)
        });
    }

    // --- Data Enrichment ---
    getVacationsEnabled(emp: GestionSolicitudResponse): number {
        return emp.diasHabilitados || 0;
    }

    getVacationsUsed(emp: GestionSolicitudResponse): number {
        return emp.diasTomados || 0;
    }

    getAvatarColor(emp: GestionSolicitudResponse): string {
        const colors=['#22c97a', '#4a9ef5', '#f5a623', '#9b6dff', '#f05c5c', '#22b8d4'];
        const index=emp.empleadoId % colors.length;
        return colors[index];
    }

    getInitials(name: string): string {
        if(!name) return '??';
        const parts=name.trim().split(' ');
        if(parts.length>=2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    }

    // --- Modal Handlers ---
    openDialog(req: FlatRequest) {
        this.selectedRequest.set(req);
        this.visibleDialog.set(true);
    }

    openEmpDetail(emp: GestionSolicitudResponse) {
        this.selectedEmp.set(emp);
        this.visibleEmpDialog.set(true);
    }

    // --- Formatting and Styling ---
    formatDateShort(fecha: string): string {
        if(!fecha) return '';
        const [year, month, day]=fecha.split('-');
        const date=new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const formatter=new Intl.DateTimeFormat('es-MX', {weekday: 'short', day: 'numeric', month: 'short'});
        const text=formatter.format(date);
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    getBadgeClasses(estatus: string | undefined | null): string {
        switch(estatus?.toUpperCase()) {
            case 'APROBADA':
                return 'text-green-700';
            case 'DISFRUTADA':
                return 'text-emerald-800';
            case 'PENDIENTE':
                return 'text-amber-700';
            case 'RECHAZADA':
                return 'text-red-700';
            case 'EN_REVISION':
                return 'text-blue-700';
            case 'CANCELADA':
                return 'text-slate-600';
            case 'ESTA':
                return 'text-blue-700';
            default:
                return 'text-slate-600';
        }
    }

    getStepCircleClasses(estatus: string | undefined | null): string {
        switch(estatus?.toUpperCase()) {
            case 'APROBADA':
            case 'DISFRUTADA':
                return 'bg-green-50 border-green-500 text-green-600';
            case 'PENDIENTE':
                return 'bg-amber-50 border-amber-500 text-amber-600';
            case 'RECHAZADA':
                return 'bg-red-50 border-red-500 text-red-600';
            default:
                return 'bg-slate-50 border-slate-200 text-slate-400';
        }
    }

    getDayChipClasses(estatus: string | undefined | null): string {
        switch(estatus?.toUpperCase()) {
            case 'APROBADA':
                return 'bg-green-50 text-green-700 border-green-200';
            case 'DISFRUTADA':
                return 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm';
            case 'PENDIENTE':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'RECHAZADA':
                return 'bg-red-50 text-red-700 border-red-200';
            case 'CANCELADA':
                return 'bg-slate-100 text-slate-600 border-slate-200';
            default:
                return 'bg-transparent text-slate-500 border-transparent hover:scale-105';
        }
    }

    getDayIcon(estatus: string | undefined | null): string {
        switch(estatus?.toUpperCase()) {
            case 'APROBADA':
                return 'pi-check';
            case 'DISFRUTADA':
                return '🏖️';
            case 'PENDIENTE':
                return 'pi-hourglass';
            case 'RECHAZADA':
                return 'pi-times';
            case 'CANCELADA':
                return 'pi-times';
            default:
                return '';
        }
    }

    // --- Complex Logic (Saldos & Calendario) ---

    committedDays(empId: number,
                  thisReqFolio: number): number {
        // En un escenario real esto se sacaría del backend.
        // Simularemos buscando días iterando las solicitudes de "este" empleado
        let count=0;
        const emp=this.empleados().find(e => e.empleadoId === empId);
        if(!emp) return count;

        emp.solicitudes.forEach(r => {
            if(r.folio !== thisReqFolio && (r.estatus?.toUpperCase() === 'APROBADA' || r.estatus?.toUpperCase() === 'EN_REVISION')) {
                r.dias.forEach(d => {
                    const dt=new Date(d.fecha);
                    if(dt>=this.SIMULATED_TODAY && d.estatus?.toUpperCase() !== 'CANCELADA' && d.estatus?.toUpperCase() !== 'RECHAZADA') {
                        count++;
                    }
                });
            }
        });
        return count;
    }

    realBalance(empId: number,
                thisReqFolio: number): number {
        const emp=this.empleados().find(e => e.empleadoId === empId);
        if(!emp) return 0;
        const req=emp.solicitudes.find(r => r.folio === thisReqFolio);

        const enabled=this.getVacationsEnabled(emp);
        const used=this.getVacationsUsed(emp);
        const committed=this.committedDays(empId, thisReqFolio);
        const reqDays=req?.dias.filter(d => d.estatus?.toUpperCase() !== 'CANCELADA').length || 0;

        return enabled - used - committed - reqDays;
    }

    getDaysByStatus(req: SolicitudGestion,
                    status: string): DiaSolicitado[] {
        return (req.dias || []).filter(d => (d.nuevoEstatus || d.estatus)?.toUpperCase() === status.toUpperCase());
    }

    getApprovedOrEnjoyedCount(req: SolicitudGestion): number {
        return (req.dias || []).filter(d => {
            const s=(d.nuevoEstatus || d.estatus)?.toUpperCase();
            return s === 'APROBADA' || s === 'DISFRUTADA';
        }).length;
    }

    getApprovalPercentage(req: SolicitudGestion): number {
        const activeDays=(req.dias || []).filter(d => (d.nuevoEstatus || d.estatus)?.toUpperCase() !== 'CANCELADA');
        const approved=this.getApprovedOrEnjoyedCount(req);
        return activeDays.length === 0 ? 0 : (approved / activeDays.length) * 100;
    }

    // --- Calendar History Calculation ---

    calendarMonths(empId: number,
                   thisReqFolio: number) {
        const emp=this.empleados().find(e => e.empleadoId === empId);
        if(!emp) return [];

        const dayMap: { [key: string]: { type: string, tip: string } }={};
        emp.solicitudes.forEach(r => {
            r.dias.forEach(d => {
                const dt=new Date(d.fecha);
                const s=d.estatus?.toUpperCase();
                let type='free', tip='';

                if(r.folio === thisReqFolio) {
                    type='this';
                    tip='Esta solicitud #' + r.folio;
                } else if((s === 'APROBADA' || s === 'DISFRUTADA') && dt<this.SIMULATED_TODAY) {
                    type='used';
                    tip='Disfrutado · sol.#' + r.folio;
                } else if((s === 'APROBADA' || s === 'DISFRUTADA') && dt>=this.SIMULATED_TODAY) {
                    type='approved';
                    tip='Aprobado futuro · sol.#' + r.folio;
                } else if(s === 'PENDIENTE' || s === 'EN_REVISION') {
                    type='pending';
                    tip='En revisión · sol.#' + r.folio;
                }

                if(type !== 'free') dayMap[d.fecha]={type, tip};
            });
        });

        const markedMonths=new Set(Object.keys(dayMap).map(d => d.slice(0, 7)));

        const mNames=['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        return Array.from(markedMonths).sort().map(ym => {
            const [yStr, mStr]=ym.split('-');
            const y=parseInt(yStr);
            const m=parseInt(mStr);
            const dim=new Date(y, m, 0).getDate();

            let usedCount=0, approvedCount=0, pendingCount=0, thisCount=0;
            const days=[];

            for(let n=1; n<=dim; n++) {
                const dtStr=`${y}-${String(m).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
                const dow=new Date(y, m - 1, n).getDay();
                const isWE=dow === 0 || dow === 6;

                if(isWE) {
                    days.push({num: n, type: 'weekend', tip: ''});
                } else if(dayMap[dtStr]) {
                    const mapped=dayMap[dtStr];
                    days.push({num: n, type: mapped.type, tip: mapped.tip});
                    if(mapped.type === 'used') usedCount++; else if(mapped.type === 'approved') approvedCount++; else if(mapped.type === 'pending') pendingCount++; else if(mapped.type === 'this') thisCount++;
                } else {
                    days.push({num: n, type: 'free', tip: ''});
                }
            }
            return {label: mNames[m - 1] + ' ' + y, days, usedCount, approvedCount, pendingCount, thisCount};
        });
    }

    getDotClass(type: string): string {
        switch(type) {
            case 'free':
                return 'bg-transparent ';
            case 'weekend':
                return 'bg-transparent text-slate-300 pointer-events-none opacity-50';
            case 'used':
                return 'bg-green-100 text-green-800 border bg-green-200';
            case 'approved':
                return 'bg-green-500 text-white';
            case 'pending':
                return 'bg-amber-100 text-amber-700 border border-amber-300';
            case 'this':
                return 'bg-blue-100 text-blue-700 border border-blue-400 ring-2 ring-blue-300 ring-offset-1';
            default:
                return 'bg-transparent';
        }
    }

    // --- Action Methods ---

    guardarCambios() {
        if(!this.selectedRequest()) return;
        const req=this.selectedRequest()!.req;

        const payload=req.dias.map(d => ({
            id: d.id, estatus: d.nuevoEstatus || d.estatus, comentario: d.comentario || ''
        }));
        console.log('Guardando cambios granulares API:', payload);
        // FIXME: Replace with actual backend call

        // Simular efecto inmediato
        req.dias.forEach(d => {
            if(d.nuevoEstatus) {
                d.estatus=d.nuevoEstatus;
                delete d.nuevoEstatus;
            }
        });

        this.visibleDialog.set(false);
    }

    // Acciones auxiliares de la plantilla
    marcarDia(d: DiaSolicitado,
              status: string,
              cancelReason='') {
        d.nuevoEstatus=status;
        d.comentario=cancelReason;
    }

    approveAll(req: SolicitudGestion) {
        if(!req.dias) return;
        req.dias.forEach(d => {
            if((d.nuevoEstatus || d.estatus) !== 'CANCELADA') {
                this.marcarDia(d, 'APROBADA');
                if(d.primerResponsable?.estatus === 'PENDIENTE') {
                    d.primerResponsable.estatus='APROBADA';
                } else if(d.segundoResponsable?.estatus === 'PENDIENTE') {
                    d.segundoResponsable.estatus='APROBADA';
                }
            }
        });
        req.estatus='APROBADA';
    }

    rejectReq(req: SolicitudGestion) {
        if(!req.dias) return;
        req.dias.forEach(d => {
            if((d.nuevoEstatus || d.estatus) !== 'CANCELADA') {
                this.marcarDia(d, 'RECHAZADA', 'Rechazado globalmente');
                if(d.primerResponsable?.estatus === 'PENDIENTE') {
                    d.primerResponsable.estatus='RECHAZADA';
                } else if(d.segundoResponsable?.estatus === 'PENDIENTE') {
                    d.segundoResponsable.estatus='RECHAZADA';
                }
            }
        });
        req.estatus='RECHAZADA';
    }
}
