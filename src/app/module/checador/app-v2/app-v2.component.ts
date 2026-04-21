import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    HostListener,
    inject,
    OnDestroy,
    OnInit,
    ViewChild,
} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {WebcamImage, WebcamInitError, WebcamModule} from 'ngx-webcam';

import {ClockFacadeService} from './services/clock-facade.service';
import {Action} from './interfaces/clock-state.interface';
import {TipoPausa} from '@/core/services/checador/TipoPausa';

/**
 * Componente Reloj Checador V2 - Pablo Reyes
 *
 * @version 2.0.0
 */
@Component({
    selector: 'app-clock-v2',
    standalone: true,
    imports: [CommonModule, WebcamModule, NgOptimizedImage],
    templateUrl: './app-v2.component.html',
    styleUrl: './app-v2.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppV2Component implements OnInit,
                                       AfterViewInit,
                                       OnDestroy {

    // ========== FACADE SERVICE ==========
    protected readonly facade=inject(ClockFacadeService);

    // ========== SELECTORES EXPUESTOS AL TEMPLATE ==========
    // UI State
    readonly currentView=this.facade.currentView;
    readonly isLoading=this.facade.isLoading;
    readonly isUploading=this.facade.isUploading;
    readonly error=this.facade.error;
    readonly successMessage=this.facade.successMessage;
    readonly showSuccessMessage=this.facade.showSuccessMessage;

    // Employee State
    readonly employee=this.facade.employee;
    readonly pauseText=this.facade.pauseText;

    // Camera State
    readonly capturedPhoto=this.facade.capturedPhoto;
    readonly cameraError=this.facade.cameraError;
    readonly cameraPermissionGranted=this.facade.cameraPermissionGranted;
    readonly countdown=this.facade.countdown;

    // Config State
    readonly noCameraMode=this.facade.noCameraMode;
    readonly hasCompensation=this.facade.hasCompensation;
    readonly unitData=this.facade.unitData;

    // Input State
    readonly code=this.facade.code;
    readonly codeMask=this.facade.codeMask;

    // Modal State
    readonly showUnitSelection=this.facade.showUnitSelection;
    readonly showAdvancedConfig=this.facade.showAdvancedConfig;
    readonly showResetInput=this.facade.showResetInput;
    readonly showCodeModal=this.facade.showCodeModal;
    readonly codeModalType=this.facade.codeModalType;
    readonly currentCode=this.facade.currentCode;

    // Unit State
    readonly filteredUnits=this.facade.filteredUnits;
    readonly selectedUnit=this.facade.selectedUnit;
    readonly isLoadingUnits=this.facade.isLoadingUnits;
    readonly searchTerm=this.facade.searchTerm;
    // Clock State
    readonly formattedDate=this.facade.formattedDate;
    readonly formattedTime=this.facade.formattedTime;

    // Observable para webcam trigger
    readonly triggerObservable=this.facade.triggerObservable;

    // ========== VIEW CHILDREN ==========
    @ViewChild('codeInput') private codeInput!: ElementRef<HTMLInputElement>;

    get unidadVinculada(): string {
        return this.facade.unitData()?.nombreCompleto ?? 'Sin unidad';
    }

    async ngOnInit(): Promise<void> {
        await this.facade.initialize();
    }

    ngAfterViewInit(): void {
        this.focusCodeInputIfNeeded();
    }

    ngOnDestroy(): void {
        this.facade.destroy();
    }

    @HostListener('window:keydown', ['$event']) handleKeyPress(event: KeyboardEvent): void {
        if(this.currentView() !== 'clock') return;

        // No interceptar si hay un input enfocado
        const activeElement=document.activeElement;
        if(activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            return;
        }

        const key=event.key;

        if(key>='0' && key<='9') {
            event.preventDefault();
            this.facade.addDigit(Number(key));
        } else if(key === 'Backspace') {
            event.preventDefault();
            this.facade.deleteDigit();
        } else if(key === 'Enter') {
            event.preventDefault();
            this.onAccept();
        }
    }

    addDigit(digit: number): void {
        this.facade.addDigit(digit);
    }

    deleteDigit(): void {
        this.facade.deleteDigit();
        this.focusCodeInputIfNeeded();
    }

    async onAccept(): Promise<void> {
        if(!this.facade.noCameraMode() && !this.facade.cameraPermissionGranted()) {
            return;
        }
        await this.facade.handleEnter();
        this.focusCodeInputIfNeeded();
    }

    async startPhotoCapture(action: Action,
                            pause?: TipoPausa): Promise<void> {
        // Si requiere cámara, verificar permisos primero
        if(!this.facade.noCameraMode() && !this.facade.cameraPermissionGranted()) {
            await this.facade.checkCameraPermissions();
            // Si después de verificar aún no hay permisos, no continuar
            if(!this.facade.cameraPermissionGranted()) {
                return;
            }
        }
        await this.facade.startPhotoCapture(action, pause);
    }

    handleImage(image: WebcamImage): void {
        this.facade.handleCapturedImage(image);
    }

    handleInitError(error: WebcamInitError): void {
        this.facade.handleCameraInitError(error);
    }

    retryCapture(): void {
        this.facade.retryCapture();
    }

    backToEmployee(): void {
        this.facade.backToEmployee();
    }

    backToClock(): void {
        this.facade.backToClock();
        this.focusCodeInputIfNeeded();
    }

    updateSearchTerm(event: Event): void {
        const input=event.target as HTMLInputElement;
        this.facade.updateSearchTerm(input.value);
    }

    selectUnitFromInput(event: Event): void {
        const input=event.target as HTMLInputElement;
        const selectedUnit=this.facade.filteredUnits().find(u => u.nombreCompleto === input.value);
        if(selectedUnit) {
            this.facade.selectUnit(selectedUnit);
        }
    }

    clearSearch(input: HTMLInputElement): void {
        input.value='';
        this.facade.updateSearchTerm('');
    }

    saveSelectedUnit(): void {
        this.facade.saveSelectedUnit();
    }

    // ========== ACCIONES DE UI - CONFIGURACIÓN AVANZADA ==========

    openAdvancedConfig(): void {
        this.facade.openAdvancedConfig();
    }

    closeAdvancedConfig(): void {
        this.facade.closeAdvancedConfig();
    }

    async syncConfiguration(): Promise<void> {
        await this.facade.syncConfiguration();
    }

    async requestConfigCode(): Promise<void> {
        await this.facade.requestConfigCode();
    }

    openCodeModal(type: 'reset' | 'noCamera'): void {
        this.facade.openCodeModal(type);
    }

    closeCodeModal(): void {
        this.facade.closeCodeModal();
    }

    addCodeDigit(digit: number): void {
        this.facade.addCodeDigit(digit);
    }

    deleteCodeDigit(): void {
        this.facade.deleteCodeDigit();
    }

    confirmCode(): void {
        this.facade.confirmCode();
    }

    private focusCodeInputIfNeeded(): void {
        if(this.currentView() === 'clock') {
            requestAnimationFrame(() => {
                this.codeInput?.nativeElement.focus();
            });
        }
    }
}
