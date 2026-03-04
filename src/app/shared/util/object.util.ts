export function normalizeProperties<T extends Record<string, any>>(
    objeto: T,
    options: {
        removeUndefined?: boolean;
        removeNull?: boolean;
        removeEmptyString?: boolean;
        removeZero?: boolean;
    }={},
): T {
    const {removeUndefined=true, removeNull=true, removeEmptyString=false, removeZero=false}=options;

    // Crear una copia para evitar mutación directa
    const objetoLimpio={...objeto};

    // Usar Object.keys para mejor rendimiento
    Object.keys(objetoLimpio).forEach((key) => {
        const value=objetoLimpio[key];

        const shouldRemove=(removeUndefined && value === undefined) || (removeNull && value === null) || (removeEmptyString && value === '') || (removeZero && value === 0);

        if(shouldRemove) {
            delete objetoLimpio[key as keyof T];
        }
    });

    return objetoLimpio;
}

/*
* // Ejemplos de uso
const usuario = {
  nombre: 'Juan',
  edad: null,
  email: undefined,
  telefono: ''
};

// Limpieza básica
const usuarioLimpio1 = limpiarPropiedades(usuario);

// Limpieza personalizada
const usuarioLimpio2 = limpiarPropiedades(usuario, {
  removeEmptyString: true,
  removeZero: true
});
* */



