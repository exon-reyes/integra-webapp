import {Empleado} from '@/core/services/checador/Empleado';
import {TipoPausa} from '@/core/services/checador/TipoPausa';
import {WebcamImage} from 'ngx-webcam';

/**
 * Tipo de vista actual en la aplicación
 */
export type ViewType='clock' | 'webcam' | 'employee';

/**
 * Tipo de acción que puede realizar el empleado
 */
export type Action=
    | 'iniciarJornada'
    | 'finalizarJornada'
    | 'finalizarJornadaDeposito'
    | 'iniciarPausa'
    | 'finalizarPausa'
    | 'registrarJornadaCompleta'
    | 'registrarPausaCompleta';

/**
 * Estado de la interfaz de usuario
 */
export interface UIState {
    /** Vista actual que se está mostrando */
    currentView: ViewType;
    /** Indica si hay una operación en progreso */
    isLoading: boolean;
    /** Indica si se está subiendo una imagen */
    isUploading: boolean;
    /** Mensaje de error actual (null si no hay error) */
    error: string | null;
    /** Texto del mensaje de éxito */
    successMessage: string;
    /** Indica si se debe mostrar el mensaje de éxito */
    showSuccessMessage: boolean;
}

/**
 * Estado relacionado con el empleado
 */
export interface EmployeeState {
    /** Datos del empleado autenticado */
    employee: Empleado | null;
    /** Acción actual que se está realizando */
    currentAction: Action | null;
    /** Tipo de pausa actual (si aplica) */
    currentPause: TipoPausa | null;
}

/**
 * Estado de la cámara web
 */
export interface CameraState {
    /** Foto capturada */
    capturedPhoto: WebcamImage | null;
    /** Error de la cámara */
    error: string | null;
    /** Indica si se otorgaron permisos de cámara */
    permissionGranted: boolean;
    /** Cuenta regresiva para captura automática */
    countdown: number | null;
}

/**
 * Configuración del sistema/kiosco
 */
export interface ConfigState {
    /** ID de la unidad configurada */
    unitId: number;
    /** Indica si se requiere cámara para el registro */
    requiresCamera: boolean;
    /** Datos completos de la unidad */
    unitData: any | null;
    tiempoEsperaKiosco?: number;
}

/**
 * Estado de los campos de entrada
 */
export interface InputState {
    /** Código NIP ingresado */
    code: string;
    /** Código de configuración */
    configCode: string;
    /** Código unificado para reset y sin cámara */
    unifiedCode: string;
}

/**
 * Estado de los modales
 */
export interface ModalState {
    /** Muestra modal de configuración */
    showConfig: boolean;
    /** Muestra modal de selección de unidad */
    showUnitSelection: boolean;
    /** Muestra modal de configuración avanzada */
    showAdvancedConfig: boolean;
    /** Muestra input de reset */
    showResetInput: boolean;
    /** Muestra modal unificado de código */
    showCodeModal: boolean;
    /** Tipo de modal de código ('reset' | 'noCamera') */
    codeModalType: 'reset' | 'noCamera' | null;
}

/**
 * Estado de unidades
 */
export interface UnitState {
    /** Lista de unidades disponibles */
    units: any[];
    /** Unidad seleccionada */
    selectedUnit: any | null;
    /** Indica si se están cargando las unidades */
    isLoading: boolean;
    /** Término de búsqueda para filtrar unidades */
    searchTerm: string;
}

/**
 * Estado del reloj (fecha y hora)
 */
export interface ClockState {
    /** Fecha formateada para mostrar */
    formattedDate: string;
    /** Hora formateada para mostrar */
    formattedTime: string;
}

/**
 * Estado consolidado de toda la aplicación
 */
export interface AppState {
    /** Estado de la UI */
    ui: UIState;
    /** Estado del empleado */
    employee: EmployeeState;
    /** Estado de la cámara */
    camera: CameraState;
    /** Estado de configuración */
    config: ConfigState;
    /** Estado de inputs */
    input: InputState;
    /** Estado de modales */
    modals: ModalState;
    /** Estado de unidades */
    units: UnitState;
    /** Estado del reloj */
    clock: ClockState;
}

/**
 * Estado inicial por defecto para la aplicación
 */
export const INITIAL_APP_STATE: AppState={
    ui: {
        currentView: 'clock',
        isLoading: false,
        isUploading: false,
        error: null,
        successMessage: '',
        showSuccessMessage: false,
    },
    employee: {
        employee: null,
        currentAction: null,
        currentPause: null,
    },
    camera: {
        capturedPhoto: null,
        error: null,
        permissionGranted: false,
        countdown: null,
    },
    config: {
        unitId: 0,
        requiresCamera: true,
        tiempoEsperaKiosco: null,
        unitData: null,
    },
    input: {
        code: '',
        configCode: '',
        unifiedCode: '',
    },
    modals: {
        showConfig: false,
        showUnitSelection: false,
        showAdvancedConfig: false,
        showResetInput: false,
        showCodeModal: false,
        codeModalType: null,
    },
    units: {
        units: [],
        selectedUnit: null,
        isLoading: false,
        searchTerm: '',
    },
    clock: {
        formattedDate: '',
        formattedTime: '',
    },
};
