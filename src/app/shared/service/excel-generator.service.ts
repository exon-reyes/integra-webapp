import {Injectable} from '@angular/core';
import * as XLSX from 'xlsx/xlsx.mjs';
import {CredencialDto} from '@/module/credencial/credencial.service';

@Injectable({providedIn: 'root'})
export class ExcelGeneratorService {
    // async generarExcelTicket(ticket: Ticket, historial: Seguimiento[]): Promise<void> {
    //     const workbook = XLSX.utils.book_new();
    //
    //     // Crear datos para la hoja
    //     const data: any[][] = [];
    //     let currentRow = 0;
    //
    //     // Título principal
    //     data.push(['DETALLE DEL TICKET']);
    //     const titleRow = currentRow++;
    //     data.push([]);
    //     currentRow++;
    //
    //     // Información del ticket
    //     data.push(['Folio', ticket.folio || 'N/A']);
    //     data.push(['Estatus', ticket.estatus?.nombre || 'N/A']);
    //     data.push(['Área', ticket.area?.nombre || 'N/A']);
    //     data.push(['Unidad', `${ticket.unidad?.clave || ''} - ${ticket.unidad?.nombre || 'N/A'}`.trim().replace(/^- /, '')]);
    //     data.push(['Tipo de reporte', ticket.titulo?.nombre || 'N/A']);
    //     data.push(['Agente', ticket.agente || 'N/A']);
    //     data.push(['Fecha creación', this.formatDate(ticket.creado)]);
    //     data.push(['Última actualización', this.formatDate(ticket.actualizado)]);
    //     currentRow += 8;
    //
    //     if (ticket.nombreArchivo) {
    //         data.push(['Archivo adjunto', ticket.nombreArchivo]);
    //         currentRow++;
    //     }
    //
    //     if (ticket.descripcion && this.stripHtml(ticket.descripcion).trim()) {
    //         data.push([]);
    //         data.push(['Descripción']);
    //         data.push([this.stripHtml(ticket.descripcion)]);
    //         currentRow += 3;
    //     }
    //
    //     let seguimientosHeaderRow = -1;
    //     let tableHeaderRow = -1;
    //
    //     // Seguimientos en formato tabla
    //     if (historial.length > 0) {
    //         data.push([]);
    //         currentRow++;
    //         data.push([`SEGUIMIENTOS (${historial.length})`]);
    //         seguimientosHeaderRow = currentRow++;
    //         data.push([]);
    //         currentRow++;
    //
    //         // Encabezados de la tabla
    //         data.push(['Fecha', 'Estatus', 'Agente', 'Descripción', 'Archivo']);
    //         tableHeaderRow = currentRow++;
    //
    //         // Datos de cada seguimiento
    //         historial.forEach((seg) => {
    //             data.push([this.formatDate(seg.creado), seg.estatus?.nombre || 'N/A', seg.agente || '', seg.descripcion ? this.stripHtml(seg.descripcion) : '', seg.nombreArchivo || '']);
    //             currentRow++;
    //         });
    //     }
    //
    //     // Crear hoja de trabajo
    //     const worksheet = XLSX.utils.aoa_to_sheet(data);
    //
    //     // Nota: XLSX básico no soporta estilos/colores
    //     // Para colores usaría exceljs en su lugar
    //
    //     // Ajustar ancho de columnas
    //     worksheet['!cols'] = [
    //         { width: 25 }, // Columna A (labels)
    //         { width: 20 }, // Columna B (valores/estatus)
    //         { width: 15 }, // Columna C (agente)
    //         { width: 40 }, // Columna D (descripción)
    //         { width: 20 } // Columna E (archivo)
    //     ];
    //
    //     // Agregar hoja al libro
    //     XLSX.utils.book_append_sheet(workbook, worksheet, 'Ticket');
    //
    //     // Descargar archivo
    //     XLSX.writeFile(workbook, `ticket-${ticket.folio || 'sin-folio'}.xlsx`);
    // }

    async generarExcelCredenciales(credenciales: CredencialDto[]): Promise<void> {
        const workbook=XLSX.utils.book_new();

        // Crear datos para la hoja
        const data: any[][]=[];

        // Encabezados
        data.push(['Usuario', 'Tipo', 'Departamento', 'Unidad', 'Nota', 'Contraseña', 'Creado', 'Actualizado']);

        // Datos de credenciales
        credenciales.forEach((credencial) => {
            data.push([
                credencial.usuario,
                credencial.tipoNombre,
                credencial.departamentoNombre,
                credencial.unidadNombreCompleto,
                credencial.nota,
                credencial.clave, // Nota: En producción considerar si mostrar la contraseña
                this.formatDate(credencial.creado),
                this.formatDate(credencial.actualizado),
            ]);
        });

        // Crear hoja de trabajo
        const worksheet=XLSX.utils.aoa_to_sheet(data);

        // Ajustar ancho de columnas
        worksheet['!cols']=[
            {width: 20}, // Usuario
            {width: 15}, // Tipo
            {width: 20}, // Departamento
            {width: 25}, // Unidad
            {width: 30}, // Nota
            {width: 20}, // Contraseña
            {width: 20}, // Creado
            {width: 20}, // Actualizado
        ];

        // Agregar hoja al libro
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Credenciales');

        // Descargar archivo
        const fecha=new Date().toISOString().split('T')[0];
        XLSX.writeFile(workbook, `credenciales-${fecha}.xlsx`);
    }

    private stripHtml(html: string): string {
        if(!html) return '';

        let counter=1;

        return html
            .replace(/<img[^>]*>/gi, '[Imagen adjunta]')
            .replace(/<\/?(p|div|br)\s*\/?>/gi, '\n')
            .replace(/<ol[^>]*>/gi, '\n')
            .replace(/<\/ol>/gi, '\n')
            .replace(/<li\s*[^>]*>/gi, () => `${counter++}. `)
            .replace(/<ul[^>]*>/gi, () => {
                counter=1;
                return '\n';
            })
            .replace(/<\/ul>/gi, '\n')
            .replace(/<li\s*[^>]*>/gi, '• ')
            .replace(/<\/li>/gi, '\n')
            .replace(/<strong\s*[^>]*>(.*?)<\/strong>/gi, '$1')
            .replace(/<b\s*[^>]*>(.*?)<\/b>/gi, '$1')
            .replace(/<em\s*[^>]*>(.*?)<\/em>/gi, '$1')
            .replace(/<i\s*[^>]*>(.*?)<\/i>/gi, '$1')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\n\s*\n/g, '\n\n')
            .replace(/[ \t]+/g, ' ')
            .trim();
    }

    private formatDate(date?: string | Date): string {
        if(!date) return 'N/A';
        const d=new Date(date);
        if(isNaN(d.getTime())) return 'Fecha inválida';
        return `${d.toLocaleDateString('es-ES')} ${d.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
        })}`;
    }
}
