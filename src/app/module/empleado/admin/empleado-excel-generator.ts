import * as ExcelJS from 'exceljs';
import {CatalogoEmpleado} from "@/service/catalogo-empleado.service";

export class EmpleadoExcelGenerator {
    static async generarExcel(empleados: CatalogoEmpleado[]): Promise<void> {
        const buffer=await fetch('assets/templates/empleados-template.xlsx').then((response) => response.arrayBuffer());

        const workbook=new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const worksheet=workbook.getWorksheet(1);

        this.actualizarFecha(worksheet);
        this.llenarDatos(worksheet, empleados);

        const excelBuffer=await workbook.xlsx.writeBuffer();
        this.descargarArchivo(excelBuffer);
    }

    private static actualizarFecha(worksheet: ExcelJS.Worksheet): void {
        const dateRow=worksheet.getRow(2);
        const dateCell=dateRow.getCell(2);

        dateCell.value=new Date().toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    private static llenarDatos(worksheet: ExcelJS.Worksheet,
                               empleados: CatalogoEmpleado[]): void {
        empleados.forEach((empleado,
                           index) => {
            const rowNum=10 + index;
            const row=worksheet.getRow(rowNum);

            row.getCell(1).value=empleado.codigo || '';
            row.getCell(2).value=empleado.nombreCompleto || '';
            row.getCell(3).value=empleado.puesto.nombre || '';
            row.getCell(4).value=empleado.unidad.nombreCompleto || '';
            row.getCell(5).value=empleado.estatus || '';
            row.getCell(6).value=empleado.fechaAlta || '';
            row.getCell(7).value=empleado.fechaBaja || '';
        });
    }

    private static descargarArchivo(buffer: ArrayBuffer): void {
        const blob=new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
        const url=window.URL.createObjectURL(blob);
        const a=document.createElement('a');
        a.href=url;
        a.download='empleados.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
    }
}
