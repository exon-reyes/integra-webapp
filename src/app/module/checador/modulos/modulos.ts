import {Component, inject, OnInit} from '@angular/core';
import {Autoridades} from "@/core/Autoridades";
import {HasPermissionDirective} from "@/core/security/HasPermissionDirective";
import {NgClass, NgOptimizedImage} from "@angular/common";
import {SafeHtml} from "@angular/platform-browser";
import {RouterLink} from "@angular/router";
import {JWTService} from "@/core/security/JWTService";

// En inlineSvg cambiar solo el width y el heigth de svg a proporciones que se ajusten a la caja de icono
export interface Feature {
    iscIcon?: string;
    title: string;
    description: string;
    colorBg: string;
    piIcon?: string;
    srcIconName?: string;
    urlNavigator?: string;
    inlineSvg?: SafeHtml;
    permission?: string;
}

export interface FeatureSection {
    title: string;
    features?: Feature[];
    hasVisibleFeatures?: boolean;
}

@Component({
    selector: 'app-modulos',
    standalone: true,
    imports: [HasPermissionDirective, NgOptimizedImage, RouterLink, NgClass],
    templateUrl: './modulos.html',
    styleUrl: './modulos.scss',
})
export class Modulos implements OnInit {
    modulos: FeatureSection[];
    private jwtService=inject(JWTService);

    ngOnInit(): void {
        this.modulos=[
            {
                title: 'Aplicaciones', features: [
                    {
                        title: 'Reloj Checador',
                        permission: Autoridades.RELOJ_CHECADOR_ACCESO,
                        srcIconName: 'reloj.svg',
                        description: 'Acceso a la App Reloj Checador',
                        colorBg: 'bg-gray-200',
                        urlNavigator: '/integra/checador',
                    },
                ],
            }, {
                title: 'Gestión de asistencia', features: [
                    {
                        title: 'Asistencia manual',
                        permission: Autoridades.ASISTENCIA_MANUAL_ACCESO_MODULO,
                        urlNavigator: '/integra/asistencia/manual',
                        description: 'En caso de eventos no controlados',
                        colorBg: 'bg-gray-200',
                        srcIconName: 'touch.svg',
                    },
                    {
                        title: 'Consulta de asistencia',
                        permission: Autoridades.CONSULTA_ASISTENCIA_CONSULTAR,
                        description: 'Jornadas registradas en cada centro de trabajo. Entradas, salidas',
                        colorBg: 'bg-gray-200',
                        srcIconName: 'schedule.svg',
                        urlNavigator: '/integra/asistencia/consulta',
                    }, {
                        permission: Autoridades.COMPENSACIONES_VER_APLICADAS,
                        urlNavigator: '/integra/asistencia/compensacion',
                        title: 'Compensaciones realizadas',
                        srcIconName: 'expired.svg',
                        description: 'Consulta el tiempo aplicado como ajuste final a la jornada del colaborador',
                        colorBg: 'bg-gray-200',
                    }, {
                        title: 'Exportación de incidencias',
                        permission: Autoridades.EXPORTACION_INCIDENCIAS_VER,
                        urlNavigator: '/integra/asistencia/exportar',
                        srcIconName: 'excel.svg',
                        description: 'Formato de datos precargados y sincronizados con el Reloj Checador',
                        colorBg: 'bg-gray-200',
                    },
                ],
            }, {
                title: 'Configuración', features: [
                    {
                        title: 'Config. Reloj Checador',
                        permission: Autoridades.CONFIG_RELOJ_VER_UNIDADES,
                        description: 'Gestiona las autorizaciones y tiempos de compensación asignados a las unidades',
                        colorBg: 'bg-gray-200',
                        urlNavigator: '/integra/asistencia/kioscos',
                        srcIconName: 'timelimit.svg',
                    },
                ],
            },
        ];

        this.modulos.forEach(section => {
            section.hasVisibleFeatures=section.features?.some(f =>
                !f.permission || this.jwtService.hasAuthority(f.permission),
            ) ?? true;
        });
    }
}
