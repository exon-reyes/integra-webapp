import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {Observable, throwError, timer} from 'rxjs';
import {retry} from 'rxjs/operators';
import {environment} from "@env/environment";

@Injectable({
    providedIn: 'root',
})
export class PasswordResetService {
    private http=inject(HttpClient);
    private apiUrl=`${environment.integraApi}/auth`;

    private retryOnServerError=retry({
        count: 3,
        delay: (error: HttpErrorResponse) => {
            if(error.status>=500 || error.status === 0) {
                return timer(1000);
            }
            return throwError(() => error);
        },
    });

    requestReset(username: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/forgot-password`, {username})
            .pipe(this.retryOnServerError);
    }

    validateToken(token: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/validate-reset-token`, {token})
            .pipe(this.retryOnServerError);
    }

    resetPassword(token: string,
                  newPassword: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/reset-password`, {token, newPassword})
            .pipe(this.retryOnServerError);
    }
}
