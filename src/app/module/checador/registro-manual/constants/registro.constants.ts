export const REGISTRO_MESSAGES={
    ERROR: {
        NO_EMPLEADO: 'No hay empleado seleccionado',
        FECHA_REQUERIDA: 'Debe seleccionar una fecha',
        HORA_INICIO_REQUERIDA: 'Debe especificar la hora de inicio',
        HORA_FIN_REQUERIDA: 'Debe especificar la hora de fin',
        TIPO_PAUSA_REQUERIDO: 'Debe especificar el tipo de pausa',
        REGISTRO_FUTURO: 'No puedes registrar una acción con fecha/hora futura',
        HORA_SALIDA_INVALIDA: 'La hora de salida no puede ser menor o igual a la hora de entrada',
        PAUSA_FUERA_RANGO: 'La pausa debe estar dentro del rango de la jornada',
        HORA_AYER_INVALIDA: 'Para iniciar jornada con fecha de ayer, la hora debe ser a partir de las 08:00 p.m.',
        SIN_ASISTENCIA: 'No se pudo vincular la pausa a ninguna asistencia activa o seleccionada',
    },
    SUCCESS: {
        REGISTRO_AGREGADO: 'Registro agregado exitosamente',
        JORNADA_COMPLETA: 'Jornada completa registrada exitosamente',
        PAUSA_COMPLETA: 'Pausa completa registrada',
        JORNADA_ACTUALIZADA: 'Jornada actualizada',
        PAUSA_ACTUALIZADA: 'Pausa actualizada',
        JORNADA_ELIMINADA: 'Jornada eliminada',
        PAUSA_ELIMINADA: 'Pausa eliminada correctamente',
    },
};

export const REGISTRO_CONFIG={
    HORA_MINIMA_AYER: 20,
    DIAS_MINIMOS_JORNADA_COMPLETA: 2,
};
