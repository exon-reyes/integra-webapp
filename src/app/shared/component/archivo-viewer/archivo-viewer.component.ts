import {Component, inject, Input} from '@angular/core';
import {MessageService} from 'primeng/api';
import {environment} from '@env/environment.development';

@Component({
    selector: 'archivo-viewer',
    template: `
        @if (urlArchivo) {
            @if (modo === 'basic') {
                <div class="mt-4 p-3 border border-gray-200 rounded-lg">
                    <div class="font-medium text-gray-700 mb-2">Archivo adjunto</div>
                    <a
                        (click)="visualizarArchivo()"
                        class="inline-flex items-center bg-blue-200 px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:outline-none focus:ring-gray-100 focus:text-blue-700"
                    >
                        <svg class="w-3.5 h-3.5 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M14.707 7.793a1 1 0 0 0-1.414 0L11 10.086V1.5a1 1 0 0 0-2 0v8.586L6.707 7.793a1 1 0 1 0-1.414 1.414l4 4a1 1 0 0 0 1.416 0l4-4a1 1 0 0 0-.002-1.414Z" />
                            <path d="M18 12h-2.55l-2.975 2.975a3.5 3.5 0 0 1-4.95 0L4.55 12H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2Zm-3 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
                        </svg>
                        {{ nombreArchivo }}</a
                    >
                </div>
            } @else {
                <a
                    (click)="visualizarArchivo()"
                    class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:outline-none focus:ring-gray-100 focus:text-blue-700 bg-orange-200"
                >
                    <svg class="w-3.5 h-3.5 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M14.707 7.793a1 1 0 0 0-1.414 0L11 10.086V1.5a1 1 0 0 0-2 0v8.586L6.707 7.793a1 1 0 1 0-1.414 1.414l4 4a1 1 0 0 0 1.416 0l4-4a1 1 0 0 0-.002-1.414Z" />
                        <path d="M18 12h-2.55l-2.975 2.975a3.5 3.5 0 0 1-4.95 0L4.55 12H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2Zm-3 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
                    </svg>
                    {{ nombreArchivo }}</a
                >
            }
        }
    `,
})
export class ArchivoViewerComponent {
    @Input() urlArchivo: string='';
    @Input() nombreArchivo: string='';
    @Input() modo: 'basic' | 'inline'='basic';

    private messageService=inject(MessageService);
    private readonly URL_SERVER_FOLDER=environment.integraApi;

    getArchivoUrl(): string {
        if(this.urlArchivo.startsWith('http')) {
            return this.urlArchivo;
        }
        return `${this.URL_SERVER_FOLDER}${this.urlArchivo}`;
    }

    visualizarArchivo(): void {
        const token=localStorage.getItem('jwt');
        if(!token) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se encontró token de autenticación',
            });
            return;
        }

        const url=this.getArchivoUrl();
        fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((response) => {
                if(!response.ok) {
                    throw new Error('Error al cargar archivo');
                }
                return response.blob();
            })
            .then((blob) => {
                const fileName=this.nombreArchivo || this.urlArchivo.split('/').pop() || 'archivo';
                const fileType=this.getFileType(fileName);
                const typedBlob=new Blob([blob], {type: fileType});
                const fileUrl=window.URL.createObjectURL(typedBlob);
                window.open(fileUrl, '_blank');
            })
            .catch((error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo visualizar el archivo',
                });
            });
    }

    getFileIcon(fileName: string): string {
        const extension=fileName.split('.').pop()?.toLowerCase();
        switch(extension) {
            case 'pdf':
                return 'pi-file-pdf';
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'bmp':
                return 'pi-image';
            case 'xls':
            case 'xlsx':
                return 'pi-file-excel';
            case 'doc':
            case 'docx':
                return 'pi-file-word';
            default:
                return 'pi-file';
        }
    }

    private getFileType(fileName: string): string {
        const extension=fileName.split('.').pop()?.toLowerCase();
        switch(extension) {
            case 'pdf':
                return 'application/pdf';
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            case 'doc':
                return 'application/msword';
            case 'docx':
                return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            default:
                return 'application/octet-stream';
        }
    }
}
