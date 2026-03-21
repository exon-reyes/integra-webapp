import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-vacaciones-page',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, ButtonModule, RippleModule],
  template: `


    <div class="flex min-h-screen bg-gray-50">
      <aside class="w-64 bg-white border-r shadow-sm">
        <div class="p-4 border-b">
          <h2 class="text-lg font-bold text-gray-800">Vacaciones</h2>
          <p class="text-sm text-gray-500">Gestión de permisos</p>
        </div>

        <nav class="p-2">
          <a routerLink="dashboard"
             routerLinkActive="bg-blue-50 text-blue-600 border-l-4 border-blue-500"
             [routerLinkActiveOptions]="{exact: true}"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            <i class="pi pi-home text-lg"></i>
            <span class="font-medium">Dashboard</span>
          </a>

          <a routerLink="solicitar"
             routerLinkActive="bg-blue-50 text-blue-600 border-l-4 border-blue-500"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            <i class="pi pi-plus-circle text-lg"></i>
            <span class="font-medium">Nueva Solicitud</span>
          </a>

          <a routerLink="historial"
             routerLinkActive="bg-blue-50 text-blue-600 border-l-4 border-blue-500"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            <i class="pi pi-history text-lg"></i>
            <span class="font-medium">Historial</span>
          </a>

          <a routerLink="calendario"
             routerLinkActive="bg-blue-50 text-blue-600 border-l-4 border-blue-500"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            <i class="pi pi-calendar text-lg"></i>
            <span class="font-medium">Calendario</span>
          </a>

          <div class="my-2 border-t"></div>

          <a routerLink="aprobacion"
             routerLinkActive="bg-green-50 text-green-600 border-l-4 border-green-500"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            <i class="pi pi-check-square text-lg"></i>
            <span class="font-medium">Aprobaciones</span>
            @if(pendientes() > 0) {
              <span class="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {{ pendientes() }}
              </span>
            }
          </a>
        </nav>
      </aside>

      <main class="flex-1 p-4 overflow-auto">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class VacacionesPageComponent implements OnInit {
  protected readonly pendientes = signal(2);

  ngOnInit() {
    // Aquí podrías cargar el número de solicitudes vacacionesPendientes
  }
}
