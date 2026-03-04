import * as ExcelJS from 'exceljs';
import {Unidad} from '@/models/empresa/unidad';

export class UnidadExcelGenerator {
    static async generarExcel(unidades: Unidad[]): Promise<void> {
        const buffer=await fetch('assets/templates/unidades.xlsx').then((response) => response.arrayBuffer());

        const workbook=new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const worksheet=workbook.getWorksheet(1);

        this.llenarDatos(worksheet, unidades);

        const excelBuffer=await workbook.xlsx.writeBuffer();
        this.descargarArchivo(excelBuffer);
    }

    private static llenarDatos(worksheet: ExcelJS.Worksheet,
                               unidades: Unidad[]): void {
        unidades.forEach((unidad,
                          index) => {
            const rowNum=4 + index;
            const row=worksheet.getRow(rowNum);
            row.getCell(1).value=unidad.nombreCompleto || '';
            row.getCell(2).value=unidad.supervisor?.nombreCompleto || '';
            row.getCell(3).value=unidad.contacto?.zona?.nombre || '';
            row.getCell(4).value=unidad.contacto?.telefono || '';
            row.getCell(5).value=unidad.activo ? 'ACTIVO' : 'INACTIVO';
        });
    }

    private static descargarArchivo(buffer: ArrayBuffer): void {
        const blob=new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
        const url=window.URL.createObjectURL(blob);
        const a=document.createElement('a');
        a.href=url;
        a.download='unidades.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
    }
}
