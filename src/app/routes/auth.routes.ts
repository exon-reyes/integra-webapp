import {Routes} from '@angular/router';
import {LoginGuard} from '@/core/security/LoginGuard';
export default [
    {path: 'denied', loadComponent: () => import('@/module/denied').then((value) => value.Denied)},
    {
        path: 'forgot-password',
        loadComponent: () => import('@/module/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent),
    },
    {
        path: 'reset-password',
        loadComponent: () => import('@/module/reset-password/reset-password').then(m => m.ResetPasswordComponent),
    },
    {
        path: 'register-request',
        loadComponent: () => import('@/module/register-request/register-request').then(m => m.RegisterRequestComponent),
    },
    {
        path: 'register-confirm',
        loadComponent: () => import('@/module/register-confirm/register-confirm').then(m => m.RegisterConfirmComponent),
    },
    {
        path: 'login',
        loadComponent: () => import('@/module/login/login').then((value) => value.Login),
        canActivate: [LoginGuard],
    },
    {
        path: '**',
        loadComponent: () => import('@/pages/notfound').then((value) => value.Notfound),
    },
] as Routes;
