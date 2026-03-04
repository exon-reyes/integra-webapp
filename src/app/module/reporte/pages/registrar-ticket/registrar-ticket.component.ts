// import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
// import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
// import { SpinnerComponent } from '@/shared/component/spinner.component';
// import { Panel } from 'primeng/panel';
// import { Menubar } from 'primeng/menubar';
// import { Button } from 'primeng/button';
// import { ContentComponent } from '@/shared/component/content.component';
// import { TicketInfoComponent } from '@/shared/component/ticket-info/ticket-info.component';
// import { Select } from 'primeng/select';
// import { CompartirReporte } from '@/module/reporte/component/share-ticket/CompartirReporte';
// import { CopyComponent } from '@/shared/component/copy/copy.component';
// import { AsyncPipe } from '@angular/common';
// import { IconField } from 'primeng/iconfield';
// import { Editor } from 'primeng/editor';
// import { Dialog } from 'primeng/dialog';
// import { InputIcon } from 'primeng/inputicon';
// import { InputText } from 'primeng/inputtext';
// import { TitleComponent } from '@/shared/component/title/title.component';
// import { ErrorResponseService } from '@/shared/service/error.response.service';
// import { SearchStatusService } from '@/shared/service/search.status.service';
// import { Unidad } from '@/models/empresa/unidad';
// import { TicketFactory } from '@/core/factories/ticket-factory';
// import { buildCopyString } from '@/module/reporte/util/ReporteUtil';
// import { RegistrarFormService } from '@/module/reporte/service/registrar-form.service';
// import { LoadFormRegister } from '@/module/reporte/service/LoadFormRegister';
// import { Area } from '@/models/area/area';
// import { folioExisteValidator } from '@/module/reporte/validator/folio-input.validator';
// import { Checkbox } from 'primeng/checkbox';
// import { ContactoComponent } from '@/components/widgets/unidad/contacto/contacto.component';
//
// interface Actividad {
//     id?: number | null;
//     descripcion: string;
//     completada: boolean;
//     fechaCreacion?: string;
//     fechaCompletado?: string | null;
//     orden?: number;
// }
//
// interface Checklist {
//     actividades: Actividad[];
//     totalActividades: number;
//     actividadesCompletadas: number;
//     porcentajeCompletado: number;
// }
//
// @Component({
//     selector: 'app-guardar-ticket',
//     standalone: true,
//     imports: [
//         FormsModule,
//         ReactiveFormsModule,
//         Panel,
//         SpinnerComponent,
//         Menubar,
//         Button,
//         ContentComponent,
//         TicketInfoComponent,
//         Select,
//         CompartirReporte,
//         CopyComponent,
//         AsyncPipe,
//         IconField,
//         Editor,
//         Dialog,
//         InputIcon,
//         InputText,
//         TitleComponent,
//         Checkbox,
//         ContactoComponent
//     ],
//     providers: [ErrorResponseService],
//     templateUrl: './registrar-ticket.component.html',
//     styleUrl: './registrar-ticket.component.scss'
// })
// export class RegistrarTicketComponent implements OnInit, OnDestroy {
//     searchStateService = inject(SearchStatusService);
//     form: FormGroup;
//     openGeneralDialog = false;
//     externalFolio = signal(false);
//     enableGeneral = signal(false);
//     archivoSeleccionado: File | null = null;
//     actividades: Actividad[] = [];
//     unidadSeleccionada: Unidad | null = null;
//     readonly buildCopyString = buildCopyString;
//     content: string = '';
//     ticketFactory = inject(TicketFactory);
//     registrarFormService: RegistrarFormService = inject(RegistrarFormService);
//     protected formData: LoadFormRegister;
//     private authService = inject(LoginService);
//     private idDepartamentoGenera: number;
//
//     constructor(private builder: FormBuilder) {
//         this.createForm();
//         this.idDepartamentoGenera = this.authService.getDepartmentId();
//         this.formData = new LoadFormRegister();
//     }
//
//     ngOnDestroy(): void {
//
//     }
//
//     ngOnInit(): void {
//         this.resetForm()
//     }
//
//     openGeneral(): void {
//         this.openGeneralDialog = true;
//     }
//
//     updateReports(area?: Area): void {
//         const reporteControl = this.form.get('reporte');
//         reporteControl?.reset();
//
//         this.formData.reportes.set(area?.reportes ?? null);
//         const disableFolio = area?.generarFolio === false;
//         this.toggleFolio(disableFolio);
//         this.externalFolio.set(disableFolio);
//     }
//
//     toggleFolio(enable: boolean): void {
//         const folioControl = this.form.get('folio');
//         enable
//             ? folioControl?.enable({ onlySelf: true, emitEvent: true })
//             : folioControl?.disable({
//                   onlySelf: true,
//                   emitEvent: true
//               });
//
//         if (!enable) {
//             this.form.patchValue({ folio: null });
//         }
//     }
//
//     hasError(controlName: string): boolean {
//         const control = this.form.get(controlName);
//         return !!(control?.hasError('required') && control.touched);
//     }
//
//     updateGeneralStatus(value: Unidad | null): void {
//         this.enableGeneral.set(!!value);
//         this.unidadSeleccionada = value;
//     }
//
//     resetForm(): void {
//         this.externalFolio.set(false);
//         this.enableGeneral.set(false);
//         this.registrarFormService.ticketSuccess.set(null);
//         this.formData.reportes.set(null);
//         this.form.reset();
//
//         Object.values(this.form.controls).forEach((control) => {
//             control.markAsUntouched();
//             control.markAsPristine();
//         });
//         this.cancelarArchivo();
//         this.actividades = [];
//     }
//
//     eliminarReportes(): void {
//         const reporteControl = this.form.get('reporte');
//         reporteControl?.reset();
//         this.formData.reportes.set(null);
//         reporteControl?.markAsUntouched();
//         reporteControl?.markAsPristine();
//     }
//
//     onFileChange(event: any) {
//         const file = event.target.files[0];
//         if (file && file.size <= 20000000) {
//             // 10MB limit
//             this.archivoSeleccionado = file;
//         } else if (file) {
//             alert('El archivo es demasiado grande. Máximo 10MB.');
//             event.target.value = '';
//         }
//     }
//
//     cancelarArchivo() {
//         this.archivoSeleccionado = null;
//         // Reset file input
//         const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
//         if (fileInput) fileInput.value = '';
//     }
//
//     formatFileSize(bytes: number): string {
//         if (bytes === 0) return '0 Bytes';
//         const k = 1024;
//         const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//         const i = Math.floor(Math.log(bytes) / Math.log(k));
//         return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//     }
//
//     agregarActividad(): void {
//         this.actividades.push({
//             id: null,
//             descripcion: '',
//             completada: false,
//             fechaCreacion: new Date().toISOString(),
//             fechaCompletado: null,
//             orden: this.actividades.length + 1
//         });
//     }
//
//     eliminarActividad(index: number): void {
//         this.actividades.splice(index, 1);
//     }
//
//     actividadesCompletadas(): number {
//         return this.actividades.filter((actividad) => actividad.completada).length;
//     }
//
//     porcentajeCompletado(): number {
//         if (this.actividades.length === 0) return 0;
//         return Math.round((this.actividadesCompletadas() / this.actividades.length) * 100);
//     }
//
//     async registrar() {
//         const formValue = { ...this.form.value };
//         const checklist = this.crearChecklist();
//         if (checklist) formValue.checklist = checklist;
//
//         const ticketData = await this.ticketFactory.crearTicketRequest({
//             ...formValue,
//             idDepartamentoGenera: this.idDepartamentoGenera
//         });
//
//         this.registrarFormService.guardar(ticketData, this.archivoSeleccionado ?? undefined);
//     }
//
//     private crearChecklist(): Checklist | null {
//         if (this.actividades.length === 0) return null;
//
//         return {
//             actividades: this.actividades.map((actividad, index) => ({
//                 ...actividad,
//                 orden: index + 1,
//                 fechaCompletado: actividad.completada && !actividad.fechaCompletado ? new Date().toISOString() : actividad.fechaCompletado
//             })),
//             totalActividades: this.actividades.length,
//             actividadesCompletadas: this.actividadesCompletadas(),
//             porcentajeCompletado: this.porcentajeCompletado()
//         };
//     }
//
//     private createForm() {
//         this.form = this.builder.group({
//             unidad: [null, Validators.required],
//             area: [null, Validators.required],
//             reporte: [null, Validators.required],
//             agente: [null],
//             estatus: [null, Validators.required],
//             descripcion: [null],
//             folio: this.builder.control(
//                 { value: null, disabled: true },
//                 {
//                     validators: [Validators.required, Validators.pattern(/^\S*$/)],
//                     asyncValidators: [folioExisteValidator()],
//                     updateOn: 'blur'
//                 }
//             )
//         });
//     }
// }
