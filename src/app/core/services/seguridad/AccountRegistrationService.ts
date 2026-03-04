import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from "@env/environment";

@Injectable({
    providedIn: 'root',
})
export class AccountRegistrationService {
    private http=inject(HttpClient);
    private apiUrl=`${environment.integraApi}/auth`;

    requestRegistration(employeeCode: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/register-request`, {employeeCode});
    }

    validateToken(token: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/validate-registration-token`, {token});
    }

    completeRegistration(token: string,
                         username: string,
                         password: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/register-confirm`, {token, username, password});
    }
}
