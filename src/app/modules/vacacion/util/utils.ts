export function getBadgeClasses(status: string): string {
    switch(status) {
        case 'APROBADA':
            return 'green';
        case 'RECHAZADA':
        case 'CANCELADA':
            return 'red';
        case 'PENDIENTE':
            return 'yellow';
        default:
            return 'bg-slate-100 text-slate-700 border-slate-200';
    }
}
