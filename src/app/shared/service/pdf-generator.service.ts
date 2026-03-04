/*
import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import { Ticket } from '@/models/reporte/ticket';
import { Seguimiento } from '@/models/reporte/seguimiento';
import { Checklist } from '@/models/checklist/checklist';

// Cargar las fuentes virtuales
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

@Injectable({ providedIn: 'root' })
export class PdfGeneratorService {
    private extractImages(html: string): string[] {
        const images: string[] = [];
        const imgRegex = /<img[^>]*src="(data:image\/[^;]+;base64,[^"]+)"[^>]*>/gi;
        let match;
        while ((match = imgRegex.exec(html)) !== null) {
            images.push(match[1]);
        }
        return images;
    }

    private stripHtml(html: string): string {
        if (!html) return '';

        let counter = 1;

        return html
            .replace(/<img[^>]*>/gi, '[IMAGEN]')
            .replace(/<\/?(p|div|br)\s*\/?>/gi, '\n')
            .replace(/<ol[^>]*>/gi, '\n')
            .replace(/<\/ol>/gi, '\n')
            .replace(/<li\s*[^>]*>/gi, () => `${counter++}. `)
            .replace(/<ul[^>]*>/gi, () => {
                counter = 1;
                return '\n';
            })
            .replace(/<\/ul>/gi, '\n')
            .replace(/<li\s*[^>]*>/gi, '• ')
            .replace(/<\/li>/gi, '\n')
            .replace(/<strong\s*[^>]*>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<b\s*[^>]*>(.*?)<\/b>/gi, '**$1**')
            .replace(/<em\s*[^>]*>(.*?)<\/em>/gi, '*$1*')
            .replace(/<i\s*[^>]*>(.*?)<\/i>/gi, '*$1*')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\n\s*\n/g, '\n\n')
            .replace(/[ \t]+/g, ' ')
            .trim();
    }

    private createContentWithImages(html: string): Content[] {
        if (!html) return [];

        const images = this.extractImages(html);
        const textContent = this.stripHtml(html);
        const content: Content[] = [];

        if (textContent) {
            const parts = textContent.split('[IMAGEN]');

            for (let i = 0; i < parts.length; i++) {
                if (parts[i].trim()) {
                    content.push({ text: parts[i].trim(), style: 'description' });
                }

                if (i < images.length) {
                    content.push({
                        image: images[i],
                        width: 300,
                        margin: [0, 5, 0, 5] as [number, number, number, number]
                    });
                }
            }
        }

        return content;
    }

    private formatDate(date?: string | Date): string {
        if (!date) return 'N/A';
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Fecha inválida';
        return `${d.toLocaleDateString('es-ES')} ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    }

    private createSectionTitle(title: string): Content {
        return {
            columns: [
                {
                    width: 5,
                    canvas: [{ type: 'rect', x: 0, y: 0, w: 3, h: 15, color: '#2563eb' }]
                },
                {
                    width: '*',
                    text: title.toUpperCase(),
                    style: 'sectionTitle',
                    margin: [8, 0, 0, 0] as [number, number, number, number]
                }
            ],
            columnGap: 5,
            margin: [0, 15, 0, 8] as [number, number, number, number]
        };
    }

    private createKeyValuePair(key: string, value?: string): Content {
        return {
            columns: [
                { text: key, style: 'label', width: 'auto' },
                { text: value?.trim() || '-', style: 'value', width: '*' }
            ],
            columnGap: 10,
            margin: [0, 2, 0, 0] as [number, number, number, number]
        };
    }

    private createTicketDetails(ticket: Ticket): Content[] {
        return [
            this.createSectionTitle('Detalle del Ticket'),
            {
                columns: [
                    [
                        this.createKeyValuePair('Folio', ticket.folio),
                        this.createKeyValuePair('Área', ticket.area?.nombre),
                        this.createKeyValuePair('Tipo de reporte', ticket.titulo?.nombre),
                        this.createKeyValuePair('Fecha creación', this.formatDate(ticket.creado))
                    ],
                    [
                        this.createKeyValuePair('Estatus', ticket.estatus?.nombre),
                        this.createKeyValuePair('Unidad', `${ticket.unidad?.clave || ''} - ${ticket.unidad?.nombre || ''}`.trim().replace(/^- /, '') || 'N/A'),
                        this.createKeyValuePair('Agente', ticket.agente),
                        this.createKeyValuePair('Última actualización', this.formatDate(ticket.actualizado))
                    ]
                ]
            },
            ...(ticket.nombreArchivo ? [this.createKeyValuePair('Archivo adjunto', ticket.nombreArchivo)] : []),
            ...(ticket.descripcion && (this.stripHtml(ticket.descripcion).trim() || this.extractImages(ticket.descripcion).length > 0)
                ? [{ text: 'Descripción', style: 'label', margin: [0, 10, 0, 5] as [number, number, number, number] }, ...this.createContentWithImages(ticket.descripcion)]
                : [])
        ];
    }

    private createChecklist(checklist: Checklist | null): Content[] {
        if (!checklist?.actividades?.length) return [];

        const actividadItems: Content[] = checklist.actividades.map(
            (actividad) =>
                ({
                    stack: [
                        {
                            text: actividad.descripcion,
                            style: actividad.completada ? 'actividadCompletada' : 'actividadPendiente'
                        },
                        ...(actividad.completada && actividad.fechaCompletado
                            ? [
                                {
                                    text: `Completada el ${this.formatDate(actividad.fechaCompletado)}`,
                                    style: 'fechaCompletado',
                                    margin: [0, 2, 0, 0] as [number, number, number, number]
                                }
                            ]
                            : [])
                    ],
                    margin: [0, 3, 0, 3] as [number, number, number, number]
                }) as Content
        );

        return [
            this.createSectionTitle('Lista de verificación de actividades'),
            {
                text: `${checklist.actividadesCompletadas} de ${checklist.totalActividades} completadas`,
                style: 'checklistStats',
                margin: [0, 0, 0, 5] as [number, number, number, number]
            },
            {
                text: `${checklist.porcentajeCompletado}%`,
                style: 'checklistPercentage',
                margin: [0, 0, 0, 10] as [number, number, number, number]
            },
            ...actividadItems
        ];
    }

    private createSeguimientos(historial: Seguimiento[]): Content[] {
        if (!historial?.length) return [];

        const seguimientoItems = historial.reduce<Content[]>((acc, seg, index) => {
            if (index > 0) {
                acc.push({
                    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#dddddd' }],
                    margin: [0, 10, 0, 0] as [number, number, number, number]
                });
            }

            acc.push({
                columns: [
                    { text: this.formatDate(seg.creado), style: 'seguimientoFecha' },
                    { text: `Estatus: ${seg.estatus?.nombre || 'N/A'}`, style: 'seguimientoEstatus', alignment: 'right' }
                ],
                margin: [0, 5, 0, 3] as [number, number, number, number]
            });

            if (seg.agente) {
                acc.push({ text: `Agente: ${seg.agente}`, style: 'seguimientoAgente', margin: [0, 0, 0, 3] as [number, number, number, number] });
            }

            if (seg.descripcion && (this.stripHtml(seg.descripcion).trim() || this.extractImages(seg.descripcion).length > 0)) {
                acc.push({ text: 'Descripción:', style: 'label', margin: [0, 3, 0, 2] as [number, number, number, number] });
                const contentWithImages = this.createContentWithImages(seg.descripcion);
                contentWithImages.forEach((item) => {
                    if (typeof item === 'object' && item !== null && 'text' in item) {
                        acc.push({ text: (item as any).text, style: 'seguimientoDesc', margin: [10, 0, 0, 5] as [number, number, number, number] });
                    } else if (typeof item === 'object' && item !== null && 'image' in item) {
                        acc.push({ image: (item as any).image, width: (item as any).width, margin: [10, 5, 0, 5] as [number, number, number, number] });
                    }
                });
            }

            if (seg.nombreArchivo) {
                acc.push({ text: 'Archivo:', style: 'label', margin: [0, 3, 0, 2] as [number, number, number, number] });
                acc.push({ text: seg.nombreArchivo, style: 'archivo', margin: [10, 0, 0, 5] as [number, number, number, number] });
            }

            return acc;
        }, []);

        return [this.createSectionTitle(`Seguimientos (${historial.length})`), ...seguimientoItems];
    }

    async generarPdfTicket(ticket: Ticket, historial: Seguimiento[], checklist?: Checklist | null): Promise<void> {
        const docDefinition: TDocumentDefinitions = {
            content: [...this.createTicketDetails(ticket), ...this.createChecklist(checklist), ...this.createSeguimientos(historial)],
            styles: {
                // Títulos principales
                sectionTitle: {
                    fontSize: 13,
                    bold: true,
                    color: '#14213d',
                    decoration: 'underline',
                    margin: [0, 15, 0, 8]
                },

                // Labels (clave de los pares)
                label: {
                    fontSize: 9,
                    bold: true,
                    color: '#000000'
                },

                // Valores (valor de los pares)
                value: {
                    fontSize: 9,
                    color: '#1e1e1e'
                },

                // Descripción
                description: {
                    fontSize: 9,
                    color: '#333333'
                },

                // Seguimientos - Fecha
                seguimientoFecha: {
                    fontSize: 10,
                    bold: true,
                    color: '#000000'
                },

                // Seguimientos - Estatus
                seguimientoEstatus: {
                    fontSize: 10,
                    bold: true,
                    color: '#000000'
                },

                // Seguimientos - Agente
                seguimientoAgente: {
                    fontSize: 8,
                    color: '#666666'
                },

                // Seguimientos - Descripción
                seguimientoDesc: {
                    fontSize: 9,
                    color: '#333333'
                },

                // Archivos
                archivo: {
                    fontSize: 9,
                    color: '#2563eb'
                },

                // Checklist
                checkboxIcon: {
                    fontSize: 14,
                    color: '#16a34a',
                    bold: true
                },
                checklistStats: {
                    fontSize: 10,
                    bold: true,
                    color: '#666666'
                },
                checklistPercentage: {
                    fontSize: 12,
                    bold: true,
                    color: '#2563eb'
                },
                actividadCompletada: {
                    fontSize: 9,
                    color: '#666666',
                    decoration: 'lineThrough'
                },
                actividadPendiente: {
                    fontSize: 9,
                    color: '#000000'
                },
                fechaCompletado: {
                    fontSize: 8,
                    color: '#16a34a',
                    italics: true
                }
            },
            defaultStyle: {
                font: 'Roboto'
            },
            pageMargins: [40, 40, 40, 40]
        };
        pdfMake.createPdf(docDefinition).download(`ticket-${ticket.folio || 'sin-folio'}.pdf`);
    }
}*/
