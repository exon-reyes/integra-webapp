import {Injectable} from '@angular/core';

/**
 * Servicio de compresión de imágenes optimizado para el reloj checador.
 *
 * Estrategia:
 * 1. Redimensiona la imagen a un máximo de MAX_WIDTH x MAX_HEIGHT preservando aspecto.
 * 2. Usa canvas.toBlob() de forma asíncrona (no bloquea el Event Loop).
 * 3. Devuelve un Blob JPEG de alta calidad (~80%) que pesa significativamente
 *    menos que una imagen nativa a calidad 30% porque la resolución ya fue reducida.
 *
 * Ventajas vs toDataURL(0.3):
 * - No genera un String base64 enorme en memoria
 * - No bloquea el hilo principal de JavaScript
 * - El payload de red es binario (sin overhead del 33% de base64)
 */
@Injectable({
    providedIn: 'root',
})
export class ImagenCompressionService {
    private static readonly MAX_WIDTH = 480;
    private static readonly MAX_HEIGHT = 480;
    private static readonly JPEG_QUALITY = 0.82;
    private static readonly MIME_TYPE = 'image/jpeg';

    /**
     * Comprime y redimensiona una imagen a partir de su DataURL.
     * Usa canvas.toBlob() de forma asíncrona para evitar bloquear la UI.
     *
     * @param dataUrl - DataURL JPEG de la webcam
     * @returns Promise<Blob> listo para enviar como FormData part
     */
    compressToBlob(dataUrl: string): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onerror = () => reject(new Error('Error al cargar imagen para compresión'));

            img.onload = () => {
                const {width, height} = this.calcularDimensiones(img.width, img.height);

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('No se pudo obtener contexto 2D del canvas'));
                    return;
                }

                // Suavizado de interpolación para mejor calidad visual al reducir tamaño
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('canvas.toBlob() devolvió null'));
                        }
                    },
                    ImagenCompressionService.MIME_TYPE,
                    ImagenCompressionService.JPEG_QUALITY,
                );
            };

            img.src = dataUrl;
        });
    }

    /**
     * Calcula las dimensiones finales respetando la relación de aspecto
     * y sin superar el límite máximo configurado.
     */
    private calcularDimensiones(srcWidth: number, srcHeight: number): {width: number; height: number} {
        const maxW = ImagenCompressionService.MAX_WIDTH;
        const maxH = ImagenCompressionService.MAX_HEIGHT;

        if (srcWidth <= maxW && srcHeight <= maxH) {
            return {width: srcWidth, height: srcHeight};
        }

        const ratio = Math.min(maxW / srcWidth, maxH / srcHeight);
        return {
            width: Math.round(srcWidth * ratio),
            height: Math.round(srcHeight * ratio),
        };
    }
}
