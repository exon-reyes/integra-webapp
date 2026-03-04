import {inject} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';

export class AbstractService {
    protected header: HttpHeaders;
    protected http: HttpClient;

    constructor() {
        this.http=inject(HttpClient);
        this.header=new HttpHeaders({'Content-Type': 'application/json'});
    }
}
