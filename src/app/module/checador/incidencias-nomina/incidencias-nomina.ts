// import {Component, inject} from '@angular/core';
// import {CommonModule} from '@angular/common';
// import {FormsModule} from '@angular/forms';
// import {TableModule} from 'primeng/table';
// import {InfoCardComponent, InfoItem} from '@/shared/component/info-card/info-card.component';
// import {fechaISOString, obtenerFinDia} from '@/shared/util/date.util';
// import {TitleComponent} from '@/shared/component/title/title.component';
// import {Panel} from 'primeng/panel';
// import {DatePicker} from 'primeng/datepicker';
// import {UnidadComponent} from '@/shared/component/unidad/unidad.component';
// import {Supervisor} from '@/shared/component/supervisor/supervisor';
// import {ZonaComponent} from '@/shared/component/zona/zona-component';
// import {Button} from 'primeng/button';
// import {FiltroConsultaIncidenciaNomina, IncidenciaNominaService} from '../service/incidencia-nomina.service';
// import {normalizeProperties} from '@/shared/util/object.util';
// import {SpinnerService} from '@/shared/service/spinner.service';
//
// @Component({
//     selector: 'app-incidencias-nomina',
//     standalone: true,
//     imports: [
//         CommonModule,
//         FormsModule,
//         TableModule,
//         TitleComponent,
//         InfoCardComponent,
//         Panel,
//         DatePicker,
//         UnidadComponent,
//         Supervisor,
//         ZonaComponent,
//         Button,
//     ],
//     templateUrl: './incidencias-nomina.html',
//     styleUrl: './incidencias-nomina.scss',
// })
// export class IncidenciasNomina {
//     // ----------------------
//     //         SERVICIOS
//     // ----------------------
//     rangeDates: Date[]=[];
//     fechasRango: string[]=[];
//
//     // ----------------------
//     //         MODELOS
//     empleadosData: any[]=[];
//     readonly INCIDENCIAS_VALIDAS=['F', 'P', 'S', 'V', 'B', 'C', 'D', 'I', 'PF', 'LP'];
//     readonly incidenciaColors: Record<string, string>={
//         F: 'bg-red-200',
//         P: 'bg-blue-200',
//         S: 'bg-orange-200',
//         V: 'bg-purple-200',
//         B: 'bg-gray-800 text-white',
//         C: 'bg-green-200',
//         D: 'bg-yellow-200',
//         I: 'bg-pink-200',
//         PF: 'bg-gray-600 text-white',
//         LP: 'bg-indigo-200',
//     };
//     unidades=[
//         {id: 1, nombre: 'Sucursal Centro'},
//         {id: 2, nombre: 'Sucursal Norte'},
//         {id: 3, nombre: 'Sucursal Sur'},
//         {id: 4, nombre: 'Sucursal Este'},
//         {id: 5, nombre: 'Sucursal Oeste'},
//     ];
//     supervisores=[
//         {id: 1, nombre: 'Juan Pérez'},
//         {id: 2, nombre: 'María García'},
//         {id: 3, nombre: 'Carlos López'},
//         {id: 4, nombre: 'Ana Martínez'},
//     ];
//     zonas=[
//         {id: 1, nombre: 'Norte'},
//         {id: 2, nombre: 'Centro'},
//         {id: 3, nombre: 'Sur'},
//         {id: 4, nombre: 'Este'},
//         {id: 5, nombre: 'Oeste'},
//     ];
//     infoItems: InfoItem[]=[
//         {
//             subtitle: '1. Revisión de Asistencia',
//             description: 'La información es un pre-llenado sugerido por el reloj checador.',
//         },
//         {
//             subtitle: '2. Captura de Ventas',
//             description: 'Puede completarlo directamente aquí como complemento del registro.',
//         },
//     ];
//     protected unidadSeleccionada;
//     protected zonaSeleccionada;
//     protected supervisorSeleccionado;
//     // ----------------------
//     private incidenciaService=inject(IncidenciaNominaService);
//     private spinnerService=inject(SpinnerService);
//
//     formatearFecha(fecha: string | Date): string {
//         const d=new Date(fecha);
//         const p=(n: number) => n.toString().padStart(2, '0');
//         const dia=['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d.getDay()];
//         return `${dia} ${p(d.getDate())}/${p(d.getMonth() + 1)}`;
//     }
//
//     // ----------------------
//     fechaLocalSimple(date: Date): string {
//         const p=(n: number) => n.toString().padStart(2, '0');
//         return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
//     }
//
//     // ----------------------
//     //   UTILIDADES BASICAS
//
//     columnNumberToLetter(col: number): string {
//         let letter='';
//         while(col>0) {
//             const mod=(col - 1) % 26;
//             letter=String.fromCharCode(65 + mod) + letter;
//             col=Math.floor((col - 1) / 26);
//         }
//         return letter;
//     }
//
//     // ----------------------
//     validarIncidencia(event: any,
//                       empleado: any,
//                       dia: string) {
//         const v=event.target.value.toUpperCase();
//         empleado.incidencias[dia]=v === '' || this.INCIDENCIAS_VALIDAS.includes(v) ? v : empleado.incidencias[dia] || '';
//         event.target.value=empleado.incidencias[dia];
//     }
//
//     obtenerClaseIncidencia(cod: string): string {
//         return this.incidenciaColors[cod] ?? '';
//     }
//
//     // ----------------------
//     //   PROCESO DE FECHAS
//
//     // ----------------------
//     generarReporte() {
//         if(!this.rangeDates || this.rangeDates.length !== 2) {
//             return;
//         }
//         this.spinnerService.show();
//         const params: FiltroConsultaIncidenciaNomina={
//             fechaInicio: fechaISOString(this.rangeDates[0]),
//             fechaFin: fechaISOString(obtenerFinDia(this.rangeDates[1])),
//             unidadId: this.unidadSeleccionada?.id || null,
//             supervisorId: this.supervisorSeleccionado?.id || null,
//             zonaId: this.zonaSeleccionada?.id || null,
//         };
//
//         this.incidenciaService.obtenerIncidenciasNomina(normalizeProperties(params)).subscribe({
//             next: (response) => {
//                 if(response.success && response.data) {
//                     this.procesarDatosBackend(response.data);
//                 }
//             },
//             error: (error) => {
//                 this.spinnerService.hide();
//             },
//             complete: () => {
//                 this.spinnerService.hide();
//             },
//         });
//     }
//
//     // ----------------------
//     async exportarExcel() {
//         try {
//             const template=await fetch('assets/templates/resumen-asistencia.xlsx').then((r) => r.arrayBuffer());
//
//             const ExcelModule=await import('exceljs');
//             const ExcelJS=ExcelModule.default ?? ExcelModule;
//
//             const workbook=new ExcelJS.Workbook();
//             await workbook.xlsx.load(template);
//
//             const ws=workbook.getWorksheet(1);
//             this.construirEncabezados(ws);
//             this.llenarDatos(ws);
//
//             const buffer=await workbook.xlsx.writeBuffer();
//             const blob=new Blob([buffer], {
//                 type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//             });
//
//             const a=document.createElement('a');
//             a.href=URL.createObjectURL(blob);
//             a.download=`incidencias-${this.fechaLocalSimple(this.rangeDates[0])}-${this.fechaLocalSimple(this.rangeDates[1])}.xlsx`;
//             a.click();
//             URL.revokeObjectURL(a.href);
//         } catch(e) {
//         }
//     }
//
//     // ----------------------
//     //   DATOS DE EJEMPLO
//
//     private initRangoFechas() {
//         const today=new Date();
//         const start=new Date();
//         start.setDate(today.getDate() - 6);
//         this.rangeDates=[start, today];
//     }
//
//     // ----------------------
//     //   REPORTE PRINCIPAL
//
//     // ----------------------
//     //   PROCESAR DATOS DEL BACKEND
//     // ----------------------
//     private procesarDatosBackend(data: any) {
//         // Cargar las fechas directamente del backend
//         this.fechasRango=data.fechas;
//
//         // Mapear los empleados del backend a la estructura del frontend
//         this.empleadosData=data.empleados.map((emp: any) => {
//             const incidencias: Record<string, string>={};
//             const ventas: Record<string, number>={};
//
//             // Mapear asistencias: 1 = presente (vacío), 0 = falta ('F')
//             data.fechas.forEach((fecha: string,
//                                  index: number) => {
//                 const asistencia=emp.asistencias[index];
//                 incidencias[fecha]=asistencia === 0 ? 'F' : '';
//                 ventas[fecha]=0; // Inicializar ventas en 0
//             });
//
//             // Calcular totales de incidencias
//             const totales=this.calcularTotales(incidencias);
//
//             return {
//                 clave: emp.clave,
//                 nombre: emp.nombreCompleto,
//                 puesto: emp.puesto,
//                 unidad: emp.nombreUnidad,
//                 zona: emp.zona,
//                 supervisor: emp.supervisor,
//                 totales,
//                 horasExtras: {total: 0, autorizo: '', comentario: ''},
//                 comentario: '',
//                 incidencias,
//                 ventas,
//             };
//         });
//     }
//
//     // ----------------------
//     //   CALCULAR TOTALES
//     // ----------------------
//     private calcularTotales(incidencias: Record<string, string>) {
//         const totales={
//             venta: 0,
//             falta: 0,
//             permiso: 0,
//             suspension: 0,
//             vacaciones: 0,
//             baja: 0,
//             capacitacion: 0,
//             descanso: 0,
//             incapacidad: 0,
//             permisoFallecimiento: 0,
//             licenciaPaternidad: 0,
//         };
//
//         Object.values(incidencias).forEach((inc) => {
//             switch(inc) {
//                 case 'F':
//                     totales.falta++;
//                     break;
//                 case 'P':
//                     totales.permiso++;
//                     break;
//                 case 'S':
//                     totales.suspension++;
//                     break;
//                 case 'V':
//                     totales.vacaciones++;
//                     break;
//                 case 'B':
//                     totales.baja++;
//                     break;
//                 case 'C':
//                     totales.capacitacion++;
//                     break;
//                 case 'D':
//                     totales.descanso++;
//                     break;
//                 case 'I':
//                     totales.incapacidad++;
//                     break;
//                 case 'PF':
//                     totales.permisoFallecimiento++;
//                     break;
//                 case 'LP':
//                     totales.licenciaPaternidad++;
//                     break;
//             }
//         });
//
//         return totales;
//     }
//
//     // ----------------------
//     //   EXCEL - ENCABEZADOS
//
//     // ----------------------
//     private construirEncabezados(ws: any) {
//         const row8=ws.getRow(8);
//         const row9=ws.getRow(9);
//
//         let col=21; // Columna U como en tu código
//
//         this.fechasRango.forEach((f) => {
//             const d=new Date(f);
//             const dias=['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
//             const titulo=`${dias[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
//
//             // Celda combinada del header principal
//             const headerCell=row8.getCell(col);
//             headerCell.value=titulo;
//             headerCell.style={
//                 // estilos para el header principal
//                 fill: {
//                     type: 'pattern',
//                     pattern: 'solid',
//                     fgColor: {argb: 'FF4F789F'}, // tu color azulado actual
//                 },
//                 font: {color: {argb: 'FFFFFFFF'}, bold: true},
//                 alignment: {horizontal: 'center', vertical: 'middle'},
//             };
//             ws.mergeCells(8, col, 8, col + 1);
//
//             // Sub-headers fila 9
//             const incHeader=row9.getCell(col);
//             const ventasHeader=row9.getCell(col + 1);
//
//             incHeader.value='Incidencia';
//             ventasHeader.value='T. Ventas';
//
//             // Aplico color verde a “Incidencia”
//             incHeader.fill={
//                 type: 'pattern',
//                 pattern: 'solid',
//                 fgColor: {argb: 'FFCCFFCC'}, // verde claro
//             };
//             incHeader.font={bold: true};
//
//             // Aplico color naranja a “T. Ventas”
//             ventasHeader.fill={
//                 type: 'pattern',
//                 pattern: 'solid',
//                 fgColor: {argb: 'FFFFE5CC'}, // naranja claro
//             };
//             ventasHeader.font={bold: true};
//
//             // Alineación para ambos sub-headers
//             incHeader.alignment={horizontal: 'center', vertical: 'middle'};
//             ventasHeader.alignment={horizontal: 'center', vertical: 'middle'};
//
//             col+=2;
//         });
//     }
//
//     // ----------------------
//     //   EXCEL - CUERPO
//     // ----------------------
//     private llenarDatos(ws: any) {
//         this.empleadosData.forEach((emp,
//                                     i) => {
//             const rn=10 + i;
//             const row=ws.getRow(rn);
//
//             let col=1;
//
//             // Datos base
//             row.getCell(col++).value=emp.clave;
//             row.getCell(col++).value=emp.nombre;
//             row.getCell(col++).value=emp.puesto;
//             row.getCell(col++).value=emp.unidad;
//             row.getCell(col++).value=emp.zona;
//
//             // FÓRMULA de ventas totales
//             const refs=this.fechasRango.map((_,
//                                              i) => this.columnNumberToLetter(22 + i * 2) + rn);
//             row.getCell(col++).value={formula: refs.join('+'), result: emp.totales.venta};
//
//             // Totales incidencias
//             const incCols=this.fechasRango.map((_,
//                                                 i) => this.columnNumberToLetter(21 + i * 2));
//
//             const codigos=[
//                 {code: 'F', key: 'falta'},
//                 {code: 'P', key: 'permiso'},
//                 {code: 'S', key: 'suspension'},
//                 {code: 'V', key: 'vacaciones'},
//                 {code: 'B', key: 'baja'},
//                 {code: 'C', key: 'capacitacion'},
//                 {code: 'D', key: 'descanso'},
//                 {code: 'I', key: 'incapacidad'},
//                 {code: 'PF', key: 'permisoFallecimiento'},
//                 {code: 'LP', key: 'licenciaPaternidad'},
//             ];
//
//             codigos.forEach(
//                 (c) =>
//                     (row.getCell(col++).value={
//                         formula: incCols.map((colRef) => `COUNTIF(${colRef}${rn},"${c.code}")`).join('+'),
//                         result: emp.totales[c.key] || 0,
//                     }),
//             );
//
//             row.getCell(col++).value=emp.horasExtras.total;
//             row.getCell(col++).value=emp.horasExtras.autorizo;
//             row.getCell(col++).value=emp.horasExtras.comentario;
//
//             row.getCell(col++).value=emp.comentario;
//
//             // Datos dinámicos
//             this.fechasRango.forEach((f) => {
//                 row.getCell(col++).value=emp.incidencias[f] || '';
//                 row.getCell(col++).value=emp.ventas[f] || 0;
//             });
//         });
//     }
// }
