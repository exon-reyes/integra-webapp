import {computed, effect, inject, Injectable, signal} from '@angular/core';
import {catchError, finalize, Observable, of, retry, Subject, takeUntil, timeout, TimeoutError} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';
import {WebcamImage} from 'ngx-webcam';

import {WorktimeService} from '@/module/checador/service/worktime.service';
import {KioscoConfigService} from '@/module/checador/service/kiosco-config-service';
import {TipoPausa} from '@/core/services/checador/TipoPausa';

import {
    Action,
    AppState,
    CameraState,
    ClockState,
    ConfigState,
    EmployeeState,
    INITIAL_APP_STATE,
    InputState,
    ModalState,
    UIState,
    UnitState,
} from '../interfaces/clock-state.interface';

/**
 * Facade Service para el Reloj Checador
 *
 * Centraliza toda la lógica de negocio y el estado de la aplicación.
 * Proporciona una API limpia para que el componente interactúe con el sistema.
 *
 * Beneficios:
 * - Estado consolidado en un solo lugar
 * - Lógica de negocio testeable
 * - Componente enfocado en presentación
 * - Actualizaciones de estado inmutables
 */
@Injectable({
    providedIn: 'root',
})
export class ClockFacadeService {
    // ========== CONSTANTES ==========
    private static readonly MAX_CODE_LENGTH=8;
    private static readonly TIMEOUT_MS=10000;
    private static readonly RETRY_COUNT=2;
    private static readonly ADMIN_CODE='1234';


    private static readonly DATE_OPTIONS: Intl.DateTimeFormatOptions=Object.freeze({
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    private static readonly TIME_OPTIONS: Intl.DateTimeFormatOptions=Object.freeze({
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
    // ========== SERVICIOS INYECTADOS ==========
    private readonly worktimeService=inject(WorktimeService);
    private readonly kioscoConfig=inject(KioscoConfigService);

    // ========== ESTADO CONSOLIDADO ==========
    private readonly state=signal<AppState>(this.loadInitialState());
    // ========== SELECTORES (COMPUTED) ==========
    // UI Selectors
    readonly currentView=computed(() => this.state().ui.currentView);
    readonly isLoading=computed(() => this.state().ui.isLoading);
    readonly isUploading=computed(() => this.state().ui.isUploading);
    readonly error=computed(() => this.state().ui.error);
    readonly successMessage=computed(() => this.state().ui.successMessage);
    readonly showSuccessMessage=computed(() => this.state().ui.showSuccessMessage);

    // Employee Selectors
    readonly employee=computed(() => this.state().employee.employee);
    readonly currentAction=computed(() => this.state().employee.currentAction);
    readonly currentPause=computed(() => this.state().employee.currentPause);

    // Camera Selectors
    readonly capturedPhoto=computed(() => this.state().camera.capturedPhoto);
    readonly cameraError=computed(() => this.state().camera.error);
    readonly cameraPermissionGranted=computed(() => this.state().camera.permissionGranted);
    readonly countdown=computed(() => this.state().camera.countdown);

    // Config Selectors
    readonly unitId=computed(() => this.state().config.unitId);
    readonly requiresCamera=computed(() => this.state().config.requiresCamera);
    readonly unitData=computed(() => this.state().config.unitData);
    readonly noCameraMode=computed(() => !this.state().config.requiresCamera);
    readonly hasCompensation=computed(() => {
        const unit=this.state().config.unitData;
        return unit?.tiempoCompensacion && unit.tiempoCompensacion !== '00:00:00';
    });

    // Input Selectors
    readonly code=computed(() => this.state().input.code);
    readonly codeMask=computed(() => '*'.repeat(this.state().input.code.length));
    readonly configCode=computed(() => this.state().input.configCode);

    // Modal Selectors
    readonly showConfig=computed(() => this.state().modals.showConfig);
    readonly showUnitSelection=computed(() => this.state().modals.showUnitSelection);
    readonly showAdvancedConfig=computed(() => this.state().modals.showAdvancedConfig);
    readonly showResetInput=computed(() => this.state().modals.showResetInput);
    readonly showCodeModal=computed(() => this.state().modals.showCodeModal);
    readonly codeModalType=computed(() => this.state().modals.codeModalType);
    readonly currentCode=computed(() => this.state().input.unifiedCode);

    // Unit Selectors
    readonly units=computed(() => this.state().units.units);
    readonly selectedUnit=computed(() => this.state().units.selectedUnit);
    readonly isLoadingUnits=computed(() => this.state().units.isLoading);
    readonly searchTerm=computed(() => this.state().units.searchTerm);
    readonly filteredUnits=computed(() => {
        const term=this.state().units.searchTerm.toLowerCase();
        if(!term) return this.state().units.units;
        return this.state().units.units.filter(u =>
            u.nombreCompleto.toLowerCase().includes(term),
        );
    });

    // Clock Selectors
    readonly formattedDate=computed(() => this.state().clock.formattedDate);
    readonly formattedTime=computed(() => this.state().clock.formattedTime);

    // Pause text selector
    readonly pauseText=computed(() => {
        const emp=this.state().employee.employee;
        if(!emp?.tipoPausa) return null;
        const pauseTypes=[
            {value: 'COMIDA' as TipoPausa, label: 'Comida'},
            {value: 'OTRA' as TipoPausa, label: 'Otra'},
        ];
        return pauseTypes.find(p => p.value === emp.tipoPausa)?.label || emp.tipoPausa;
    });

    // ========== SUBJECTS Y CLEANUP ==========
    private readonly destroy$=new Subject<void>();
    private readonly trigger$=new Subject<void>();
    private clockIntervalId?: number;
    private countdownIntervalId?: number;
    private captureTimerId?: number;

    // Cache para optimización de fecha/hora
    private dateCache={date: '', formatted: ''};
    private timeCache={time: '', formatted: ''};

    // ========== CONSTRUCTOR ==========
    constructor() {
        this.setupEffects();
        this.startClock();
    }

    // ========== GETTERS PÚBLICOS ==========
    get triggerObservable(): Observable<void> {
        return this.trigger$.asObservable();
    }

    // ========== ACCIONES PÚBLICAS - AUTENTICACIÓN ==========

    /**
     * Autentica un empleado por su NIP
     */
    async authenticateEmployee(nip: string): Promise<void> {
        if(!nip || this.state().ui.isLoading) return;

        this.updateUI({isLoading: true, error: null});

        this.worktimeService
            .consultarEmpleadoPorNip(nip)
            .pipe(
                timeout(ClockFacadeService.TIMEOUT_MS),
                retry(ClockFacadeService.RETRY_COUNT),
                takeUntil(this.destroy$),
                catchError((error: HttpErrorResponse) => {
                    this.updateUI({error: this.getAuthErrorMessage(error)});
                    return of(null);
                }),
                finalize(() => this.updateUI({isLoading: false})),
            )
            .subscribe((response) => {
                this.updateInput({code: ''});
                if(response?.success) {
                    this.updateEmployee({employee: response.data});
                    this.updateUI({currentView: 'employee'});
                }
            });
    }

    // ========== ACCIONES PÚBLICAS - CÁMARA ==========

    /**
     * Inicia el proceso de captura de foto
     */
    async startPhotoCapture(action: Action,
                            pause?: TipoPausa): Promise<void> {
        // Modo sin cámara
        if(!this.state().config.requiresCamera) {
            this.updateEmployee({currentAction: action, currentPause: pause || null});
            await this.processWithoutCamera();
            return;
        }

        // Modo con cámara - verificar permisos antes de continuar
        if(!this.state().camera.permissionGranted) {
            this.updateUI({error: 'Se requieren permisos de cámara para continuar.'});
            return;
        }

        this.updateEmployee({currentAction: action, currentPause: pause || null});
        this.updateUI({currentView: 'webcam'});
        this.resetCamera();
        this.startCountdown();
    }

    /**
     * Captura la foto
     */
    capturePhoto(): void {
        this.trigger$.next();
    }

    /**
     * Maneja la imagen capturada
     */
    handleCapturedImage(image: WebcamImage): void {
        this.clearTimers();
        this.updateCamera({capturedPhoto: image});
        this.processImage(image);
    }

    /**
     * Maneja errores de inicialización de la cámara
     */
    handleCameraInitError(error: any): void {
        this.updateCamera({error: error.message});
        this.clearTimers();
    }

    /**
     * Reintenta la captura
     */
    retryCapture(): void {
        const action=this.state().employee.currentAction;
        const pause=this.state().employee.currentPause;
        if(action) {
            this.startPhotoCapture(action, pause || undefined);
        }
    }

    // ========== ACCIONES PÚBLICAS - NAVEGACIÓN ==========

    /**
     * Regresa a la vista de empleado
     */
    backToEmployee(): void {
        this.updateUI({currentView: 'employee'});
        this.resetCamera();
        this.updateEmployee({currentAction: null, currentPause: null});
        this.clearTimers();
    }

    /**
     * Regresa a la vista del reloj
     */
    backToClock(): void {
        this.updateUI({currentView: 'clock'});
        this.resetState();
        this.clearTimers();
    }

    // ========== ACCIONES PÚBLICAS - INPUT ==========

    /**
     * Agrega un dígito al código
     */
    addDigit(digit: number): void {
        const current=this.state().input.code;
        if(current.length<ClockFacadeService.MAX_CODE_LENGTH) {
            this.updateInput({code: current + digit.toString()});
        }
    }

    /**
     * Borra el último dígito
     */
    deleteDigit(): void {
        const current=this.state().input.code;
        if(current.length>0) {
            this.updateInput({code: current.slice(0, -1)});
        }
    }

    /**
     * Maneja la tecla Enter
     */
    handleEnter(): void {
        this.authenticateEmployee(this.state().input.code);
    }

    // ========== ACCIONES PÚBLICAS - CONFIGURACIÓN ==========

    /**
     * Alterna el modal de configuración
     */
    toggleConfig(): void {
        this.updateModals({showConfig: !this.state().modals.showConfig});
        this.updateInput({configCode: ''});
    }

    /**
     * Agrega dígito al código de configuración
     */
    addConfigDigit(digit: number): void {
        const current=this.state().input.configCode;
        if(current.length<4) {
            this.updateInput({configCode: current + digit.toString()});
        }
    }

    /**
     * Borra dígito del código de configuración
     */
    deleteConfigDigit(): void {
        const current=this.state().input.configCode;
        if(current.length>0) {
            this.updateInput({configCode: current.slice(0, -1)});
        }
    }

    /**
     * Aplica la configuración
     */
    applyConfiguration(): void {
        const code=this.state().input.configCode;
        if(code === ClockFacadeService.ADMIN_CODE) {
            const currentConfig=this.state().config;
            const newConfig: ConfigState={
                ...currentConfig,
                requiresCamera: !currentConfig.requiresCamera,
            };

            this.updateConfig(newConfig);
            this.saveConfigToStorage(newConfig);
            this.updateModals({showConfig: false});
            this.updateInput({configCode: ''});

            const message=newConfig.requiresCamera
                ? 'Modo con cámara activado'
                : 'Modo sin cámara activado';
            this.showSuccess(message);
        } else {
            this.updateUI({error: 'Código incorrecto'});
            setTimeout(() => this.updateUI({error: null}), 2000);
        }
    }

    // ========== ACCIONES PÚBLICAS - UNIDADES ==========

    /**
     * Selecciona una unidad
     */
    selectUnit(unit: any): void {
        this.updateUnits({selectedUnit: unit});
    }

    /**
     * Guarda la unidad seleccionada
     */
    saveSelectedUnit(): void {
        const unit=this.state().units.selectedUnit;
        if(!unit) return;

        try {
            localStorage.setItem('unidad_reloj', JSON.stringify(unit));

            const newConfig: ConfigState={
                unitId: unit.id,
                requiresCamera: unit.requiereCamara ?? true,
                unitData: unit,
            };

            this.updateConfig(newConfig);
            this.updateModals({showUnitSelection: false});
            this.updateUnits({selectedUnit: null});
        } catch(error) {
            console.error('Error al guardar unidad:', error);
            this.updateUI({error: 'Error al guardar la unidad seleccionada'});
        }
    }

    /**
     * Actualiza el término de búsqueda de unidades
     */
    updateSearchTerm(term: string): void {
        this.updateUnits({searchTerm: term});
    }

    // ========== ACCIONES PÚBLICAS - MODALES AVANZADOS ==========

    /**
     * Abre el modal de configuración avanzada
     */
    openAdvancedConfig(): void {
        this.updateModals({showAdvancedConfig: true});
    }

    /**
     * Cierra el modal de configuración avanzada
     */
    closeAdvancedConfig(): void {
        this.updateModals({
            showAdvancedConfig: false,
            showResetInput: false,
            showCodeModal: false,
            codeModalType: null,
        });
        this.updateInput({unifiedCode: ''});
    }


    /**
     * Sincroniza la configuración
     */
    async syncConfiguration(): Promise<void> {
        const unitId=this.state().config.unitId;
        if(!unitId) return;

        this.updateUI({isLoading: true, error: null});

        this.kioscoConfig
            .obtenerUnidadKiosco(unitId)
            .pipe(
                timeout(5000),
                takeUntil(this.destroy$),
                finalize(() => this.updateUI({isLoading: false})),
            )
            .subscribe({
                next: (response) => {
                    if(response?.success && response.data) {
                        const newConfig: ConfigState={
                            unitId: response.data.id,
                            requiresCamera: response.data.requiereCamara ?? true,
                            unitData: response.data,
                        };
                        this.updateConfig(newConfig);
                        localStorage.setItem('unidad_reloj', JSON.stringify(response.data));
                        this.closeAdvancedConfig();
                    }
                },
                error: () => this.updateUI({error: 'Error al sincronizar'}),
            });
    }

    /**
     * Solicita código de configuración
     */
    async requestConfigCode(): Promise<void> {
        const unitId=this.state().config.unitId;
        if(!unitId) return;

        this.updateUI({isLoading: true, error: null});

        this.kioscoConfig
            .solicitarCodigo(unitId)
            .pipe(
                timeout(5000),
                catchError(() => {
                    this.updateUI({error: 'Error al solicitar código'});
                    return of(null);
                }),
                finalize(() => this.updateUI({isLoading: false})),
            )
            .subscribe((response) => {
                if(response?.success) {
                    this.showSuccess('Código de configuración solicitado');
                    this.closeAdvancedConfig();
                }
            });
    }

    // ========== ACCIONES PÚBLICAS - MODAL UNIFICADO ==========

    /**
     * Abre el modal unificado de código
     */
    openCodeModal(type: 'reset' | 'noCamera'): void {
        this.updateModals({
            showCodeModal: true,
            codeModalType: type,
        });
        this.updateInput({unifiedCode: ''});
        this.updateUI({error: null});
    }

    /**
     * Cierra el modal unificado de código
     */
    closeCodeModal(): void {
        this.updateModals({
            showCodeModal: false,
            codeModalType: null,
        });
        this.updateInput({unifiedCode: ''});
        this.updateUI({error: null});
    }

    /**
     * Agrega dígito al código unificado
     */
    addCodeDigit(digit: number): void {
        const current=this.state().input.unifiedCode;
        if(current.length<5) {
            this.updateInput({unifiedCode: current + digit.toString()});
        }
    }

    /**
     * Borra dígito del código unificado
     */
    deleteCodeDigit(): void {
        const current=this.state().input.unifiedCode;
        if(current.length>0) {
            this.updateInput({unifiedCode: current.slice(0, -1)});
        }
    }

    /**
     * Confirma el código según el tipo
     */
    async confirmCode(): Promise<void> {
        const code=this.state().input.unifiedCode;
        const type=this.state().modals.codeModalType;
        const unitId=this.state().config.unitId;

        if(code.length !== 5 || !unitId || !type) return;

        this.updateUI({isLoading: true, error: null});

        if(type === 'reset') {
            await this.executeResetWithCode(code);
        } else {
            await this.confirmNoCameraWithCode(code);
        }
    }

    /**
     * Verifica permisos de cámara
     */
    async checkCameraPermissions(): Promise<void> {
        if(!this.state().config.requiresCamera) {
            this.updateCamera({permissionGranted: true});
            return;
        }

        try {
            const stream=await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: {ideal: 320},
                    height: {ideal: 240},
                },
            });
            this.updateCamera({permissionGranted: true});
            stream.getTracks().forEach((track) => track.stop());
        } catch(error) {
            this.updateCamera({permissionGranted: false});
        }
    }

    /**
     * Inicializa el servicio
     */
    async initialize(): Promise<void> {
        await this.verifyUnitConfiguration();

        if(this.state().config.requiresCamera) {
            await this.checkCameraPermissions();
        } else {
            this.updateCamera({permissionGranted: true});
        }
    }

    // ========== ACCIONES PÚBLICAS - PERMISOS ==========

    /**
     * Limpia recursos
     */
    destroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.clearAllTimers();
    }

    // ========== INICIALIZACIÓN ==========

    private async executeResetWithCode(code: string): Promise<void> {
        const unitId=this.state().config.unitId;

        this.kioscoConfig
            .usarCodigoConfiguracion(unitId, code)
            .pipe(
                timeout(5000),
                takeUntil(this.destroy$),
                finalize(() => this.updateUI({isLoading: false})),
            )
            .subscribe({
                next: (response) => {
                    if(response?.success) {
                        localStorage.removeItem('unidad_reloj');
                        location.reload();
                    }
                },
                error: (error: HttpErrorResponse) => {
                    const message=error.status === 409
                        ? 'Código inválido'
                        : 'Error de reset';
                    this.updateUI({error: message});
                },
            });
    }

    // ========== CLEANUP ==========

    private async confirmNoCameraWithCode(code: string): Promise<void> {
        const unitId=this.state().config.unitId;

        this.kioscoConfig
            .usarCodigoConfiguracion(unitId, code)
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.updateUI({isLoading: false})),
            )
            .subscribe({
                next: (response) => {
                    if(response?.success) {
                        const newConfig: ConfigState={
                            unitId: unitId,
                            requiresCamera: false,
                            unitData: this.state().config.unitData,
                        };
                        this.updateConfig(newConfig);

                        const unitActual=JSON.parse(localStorage.getItem('unidad_reloj') || '{}');
                        unitActual.requiereCamara=false;
                        localStorage.setItem('unidad_reloj', JSON.stringify(unitActual));

                        this.closeCodeModal();
                        this.showSuccess('Modo sin cámara activado');
                    }
                },
                error: (error: HttpErrorResponse) => {
                    const message=error.status === 409
                        ? 'Código inválido'
                        : 'Error al confirmar código';
                    this.updateUI({error: message});
                },
            });
    }

    // ========== MÉTODOS PRIVADOS - ACTUALIZACIÓN DE ESTADO ==========

    private updateState(updater: (state: AppState) => AppState): void {
        this.state.update(updater);
    }

    private updateUI(partial: Partial<UIState>): void {
        this.updateState(state => ({
            ...state,
            ui: {...state.ui, ...partial},
        }));
    }

    private updateEmployee(partial: Partial<EmployeeState>): void {
        this.updateState(state => ({
            ...state,
            employee: {...state.employee, ...partial},
        }));
    }

    private updateCamera(partial: Partial<CameraState>): void {
        this.updateState(state => ({
            ...state,
            camera: {...state.camera, ...partial},
        }));
    }

    private updateConfig(partial: Partial<ConfigState> | ConfigState): void {
        this.updateState(state => ({
            ...state,
            config: {...state.config, ...partial},
        }));
    }

    private updateInput(partial: Partial<InputState>): void {
        this.updateState(state => ({
            ...state,
            input: {...state.input, ...partial},
        }));
    }

    private updateModals(partial: Partial<ModalState>): void {
        this.updateState(state => ({
            ...state,
            modals: {...state.modals, ...partial},
        }));
    }

    private updateUnits(partial: Partial<UnitState>): void {
        this.updateState(state => ({
            ...state,
            units: {...state.units, ...partial},
        }));
    }

    private updateClock(partial: Partial<ClockState>): void {
        this.updateState(state => ({
            ...state,
            clock: {...state.clock, ...partial},
        }));
    }

    // ========== MÉTODOS PRIVADOS - PROCESAMIENTO ==========

    private compressImage(dataUrl: string,
                          quality=0.4): Promise<string> {
        return new Promise((resolve) => {
            const img=new Image();
            img.onload=() => {
                const canvas=document.createElement('canvas');
                canvas.width=img.width;
                canvas.height=img.height;
                canvas.getContext('2d')!.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src=dataUrl;
        });
    }

    private async processImage(image: WebcamImage): Promise<void> {
        const employee=this.state().employee.employee;
        const action=this.state().employee.currentAction;

        if(!employee || !action) {
            this.updateUI({error: 'Error: Faltan datos para procesar la solicitud.'});
            return;
        }

        this.updateUI({isUploading: true, error: null});

        const compressedPhoto=await this.compressImage(image.imageAsDataUrl);
        const compressedImage={...image, imageAsDataUrl: compressedPhoto} as WebcamImage;
        const {apiCall, successMessage}=this.getActionConfig(compressedImage);
        if(!apiCall) return;

        apiCall
            .pipe(
                timeout(ClockFacadeService.TIMEOUT_MS * 2),
                takeUntil(this.destroy$),
                finalize(() => this.updateUI({isUploading: false})),
                catchError((error: HttpErrorResponse) => {
                    this.updateUI({error: this.getProcessErrorMessage(error)});
                    return of(null);
                }),
            )
            .subscribe((response) => {
                if(response?.success) {
                    this.showSuccess(successMessage);
                }
            });
    }

    private async processWithoutCamera(): Promise<void> {
        const employee=this.state().employee.employee;
        const action=this.state().employee.currentAction;

        if(!employee || !action) {
            this.updateUI({error: 'Error: Faltan datos para procesar la solicitud.'});
            return;
        }

        this.updateUI({isUploading: true, error: null});

        const {apiCall, successMessage}=this.getActionConfigNoCamera();
        if(!apiCall) return;

        apiCall
            .pipe(
                timeout(ClockFacadeService.TIMEOUT_MS),
                takeUntil(this.destroy$),
                finalize(() => this.updateUI({isUploading: false})),
                catchError((error: HttpErrorResponse) => {
                    this.updateUI({error: this.getProcessErrorMessage(error)});
                    return of(null);
                }),
            )
            .subscribe((response) => {
                if(response?.success) {
                    this.showSuccess(successMessage);
                }
            });
    }

    private getActionConfig(image: WebcamImage): { apiCall: Observable<any> | null; successMessage: string } {
        const employee=this.state().employee.employee!;
        const action=this.state().employee.currentAction!;
        const pause=this.state().employee.currentPause;
        const photo=image.imageAsDataUrl;
        const unitId=this.state().config.unitId;

        switch(action) {
            case 'iniciarJornada':
                return {
                    apiCall: this.worktimeService.iniciarJornada(employee.id, photo, unitId, employee.unidadAsignadaId),
                    successMessage: '¡Jornada iniciada con éxito!',
                };
            case 'finalizarJornada':
                return {
                    apiCall: this.worktimeService.finalizarJornada(employee.id, photo, unitId, employee.unidadAsignadaId),
                    successMessage: '¡Jornada finalizada con éxito!',
                };
            case 'finalizarJornadaDeposito':
                return {
                    apiCall: this.worktimeService.finalizarJornadaDeposito(employee.id, photo, unitId, employee.unidadAsignadaId),
                    successMessage: '¡Jornada finalizada por depósito!',
                };
            case 'iniciarPausa':
                if(!pause) return {apiCall: null, successMessage: ''};
                return {
                    apiCall: this.worktimeService.iniciarPausa(employee.id, pause, photo, unitId, employee.unidadAsignadaId),
                    successMessage: `¡Pausa de ${pause} iniciada!`,
                };
            case 'finalizarPausa':
                if(!pause) return {apiCall: null, successMessage: ''};
                return {
                    apiCall: this.worktimeService.finalizarPausa(employee.id, pause, photo, unitId, employee.unidadAsignadaId),
                    successMessage: `¡Pausa de ${pause} finalizada!`,
                };
            default:
                this.updateUI({error: 'Acción no reconocida.'});
                return {apiCall: null, successMessage: ''};
        }
    }

    private getActionConfigNoCamera(): { apiCall: Observable<any> | null; successMessage: string } {
        const employee=this.state().employee.employee!;
        const action=this.state().employee.currentAction!;
        const pause=this.state().employee.currentPause;
        const unitId=this.state().config.unitId;

        switch(action) {
            case 'iniciarJornada':
                return {
                    apiCall: this.worktimeService.iniciarJornada(employee.id, null, unitId, employee.unidadAsignadaId),
                    successMessage: '¡Jornada iniciada con éxito!',
                };
            case 'finalizarJornada':
                return {
                    apiCall: this.worktimeService.finalizarJornada(employee.id, null, unitId, employee.unidadAsignadaId),
                    successMessage: '¡Jornada finalizada con éxito!',
                };
            case 'finalizarJornadaDeposito':
                return {
                    apiCall: this.worktimeService.finalizarJornadaDeposito(employee.id, null, unitId, employee.unidadAsignadaId),
                    successMessage: '¡Jornada finalizada por depósito!',
                };
            case 'iniciarPausa':
                if(!pause) return {apiCall: null, successMessage: ''};
                return {
                    apiCall: this.worktimeService.iniciarPausa(employee.id, pause, null, unitId, employee.unidadAsignadaId),
                    successMessage: `¡Pausa de ${pause} iniciada!`,
                };
            case 'finalizarPausa':
                if(!pause) return {apiCall: null, successMessage: ''};
                return {
                    apiCall: this.worktimeService.finalizarPausa(employee.id, pause, null, unitId, employee.unidadAsignadaId),
                    successMessage: `¡Pausa de ${pause} finalizada!`,
                };
            default:
                this.updateUI({error: 'Acción no reconocida.'});
                return {apiCall: null, successMessage: ''};
        }
    }

    // ========== MÉTODOS PRIVADOS - MANEJO DE ERRORES ==========

    private getAuthErrorMessage(error: any): string {
        if(error instanceof TimeoutError) {
            return 'La consulta está tardando más de lo esperado. Verifica tu conexión.';
        }

        if(error instanceof HttpErrorResponse) {
            if(error.status === 0) {
                return 'No se puede conectar al servidor. Verifica tu conexión a internet.';
            }
            if(error.status === 404) {
                return 'Usuario no encontrado. Verifica tu NIP.';
            }
            if(error.status>=500) {
                return 'Error del servidor. Intenta nuevamente en unos momentos.';
            }

            return error.error?.message || 'Error de conexión con el servidor.';
        }

        return 'Error inesperado. Inténtalo de nuevo.';
    }

    private getProcessErrorMessage(error: any): string {
        if(error instanceof TimeoutError) {
            return 'El registro está tardando más de lo esperado. Verifica tu conexión.';
        }

        if(error instanceof HttpErrorResponse) {
            if(error.status === 0) {
                return 'No se puede conectar al servidor. Verifica tu conexión.';
            }
            if(error.status>=500) {
                return 'Error del servidor. Intenta nuevamente.';
            }

            return error.error?.message || 'No se pudo registrar la operación. Inténtalo de nuevo.';
        }

        return 'Error inesperado. Inténtalo de nuevo.';
    }

    // ========== MÉTODOS PRIVADOS - UTILIDADES ==========

    private showSuccess(message: string): void {
        this.updateUI({
            successMessage: message,
            showSuccessMessage: true,
        });

        setTimeout(() => {
            this.updateUI({showSuccessMessage: false});
            this.backToClock();
        }, 2500);
    }

    private resetCamera(): void {
        this.updateCamera({
            capturedPhoto: null,
            error: null,
        });
        this.updateUI({error: null});
    }

    private resetState(): void {
        this.updateEmployee({
            employee: null,
            currentAction: null,
            currentPause: null,
        });
        this.updateUI({error: null});
        this.updateInput({code: ''});
        this.resetCamera();
    }

    private startCountdown(): void {
        const countdownTime=this.state().config.unitData?.tiempoEsperaKiosco || 3;
        this.updateCamera({countdown: countdownTime});

        this.countdownIntervalId=window.setInterval(() => {
            const current=this.state().camera.countdown;
            if(current !== null && current>0) {
                this.updateCamera({countdown: current - 1});
            } else {
                this.updateCamera({countdown: null});
                this.clearCountdownTimer();
            }
        }, 1000);

        this.captureTimerId=window.setTimeout(() => {
            this.capturePhoto();
        }, countdownTime * 1000);
    }

    private clearTimers(): void {
        if(this.captureTimerId) {
            clearTimeout(this.captureTimerId);
            this.captureTimerId=undefined;
        }
        this.clearCountdownTimer();
    }

    private clearCountdownTimer(): void {
        if(this.countdownIntervalId) {
            clearInterval(this.countdownIntervalId);
            this.countdownIntervalId=undefined;
        }
    }

    private clearAllTimers(): void {
        this.clearTimers();
        if(this.clockIntervalId) {
            clearInterval(this.clockIntervalId);
            this.clockIntervalId=undefined;
        }
    }

    // ========== MÉTODOS PRIVADOS - RELOJ ==========

    private startClock(): void {
        this.updateDateTime();
        this.clockIntervalId=window.setInterval(() => this.updateDateTime(), 1000);
    }

    private updateDateTime(): void {
        const now=new Date();
        const dateKey=now.toDateString();
        const timeKey=`${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

        if(this.dateCache.date !== dateKey) {
            this.dateCache.date=dateKey;
            this.dateCache.formatted=now.toLocaleDateString('es-ES', ClockFacadeService.DATE_OPTIONS);
            this.updateClock({formattedDate: this.dateCache.formatted});
        }

        if(this.timeCache.time !== timeKey) {
            this.timeCache.time=timeKey;
            this.timeCache.formatted=now.toLocaleTimeString('es-ES', ClockFacadeService.TIME_OPTIONS);
            this.updateClock({formattedTime: this.timeCache.formatted});
        }
    }

    // ========== MÉTODOS PRIVADOS - CONFIGURACIÓN ==========

    private loadInitialState(): AppState {
        const config=this.loadConfigFromStorage();
        return {
            ...INITIAL_APP_STATE,
            config,
        };
    }

    private loadConfigFromStorage(): ConfigState {
        try {
            const savedUnit=localStorage.getItem('unidad_reloj');
            if(savedUnit) {
                const unit=JSON.parse(savedUnit);
                return {
                    unitId: unit.id,
                    requiresCamera: unit.requiereCamara ?? true,
                    unitData: unit,
                };
            }
        } catch(error) {
        }

        return {
            unitId: 0,
            requiresCamera: true,
            unitData: null,
        };
    }

    private saveConfigToStorage(config: ConfigState): void {
        try {
            localStorage.setItem('checador-config', JSON.stringify(config));
        } catch(error) {
        }
    }

    private async verifyUnitConfiguration(): Promise<void> {
        const config=this.state().config;
        if(config.unitId === 0) {
            await this.loadUnits();
            this.updateModals({showUnitSelection: true});
        } else {
            try {
                const savedUnit=localStorage.getItem('unidad_reloj');
                if(savedUnit) {
                    const unit=JSON.parse(savedUnit);
                    this.updateConfig({unitData: unit});
                }
            } catch(error) {
            }
            this.syncConfigurationSilent();
        }
    }

    private syncConfigurationSilent(): void {
        const unitId=this.state().config.unitId;
        if(!unitId) return;

        this.kioscoConfig
            .obtenerUnidadKiosco(unitId)
            .pipe(
                timeout(5000),
                takeUntil(this.destroy$),
                catchError(() => of(null)),
            )
            .subscribe((response) => {
                if(response?.success && response.data) {
                    const localUnit=JSON.parse(localStorage.getItem('unidad_reloj') || '{}');

                    this.updateConfig({unitData: response.data});

                    if(localUnit.versionKiosco !== response.data.versionKiosco) {
                        const newConfig: ConfigState={
                            unitId: response.data.id,
                            requiresCamera: response.data.requiereCamara ?? true,
                            unitData: response.data,
                        };
                        this.updateConfig(newConfig);
                        localStorage.setItem('unidad_reloj', JSON.stringify(response.data));
                    }
                }
            });
    }

    private async loadUnits(): Promise<void> {
        this.updateUnits({isLoading: true});

        this.kioscoConfig
            .obtenerUnidadesKiosco()
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.updateUnits({isLoading: false})),
            )
            .subscribe({
                next: (response) => {
                    if(response.success) {
                        this.updateUnits({units: response.data || []});
                    } else {
                        this.updateUI({error: 'Error al cargar unidades'});
                    }
                },
                error: (error) => {
                    this.updateUI({error: 'Error al cargar unidades'});
                },
            });
    }

    // ========== EFFECTS ==========

    private setupEffects(): void {
        // Sincronizar configuración con localStorage
        effect(() => {
            const config=this.state().config;
            if(config.unitId>0) {
                this.saveConfigToStorage(config);
            }
        });
    }
}
