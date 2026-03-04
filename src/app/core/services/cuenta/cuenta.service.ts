import {Injectable} from '@angular/core';
import {environment} from '@env/environment';
import {HttpClient} from '@angular/common/http';
import {ResponseData} from '@/core/responseData';
import {Proveedor} from '@/models/cuenta/proveedor';
import {Cuenta} from '@/models/cuenta/cuenta';

@Injectable({
    providedIn: 'root',
})
export class CuentaService {
    private readonly apiUrl=`${environment.integraApi}`;

    constructor(private httpClient: HttpClient) {
    }

    obtenerProveedores() {
        return this.httpClient.get<ResponseData<Proveedor[]>>(`${this.apiUrl}/proveedores`);
    }

    obtenerCuentas(params) {
        return this.httpClient.get<ResponseData<Proveedor>>(`${this.apiUrl}/credenciales`, {params: params});
    }

    obtenerDetalles(id: number) {
        return this.httpClient.get<ResponseData<Cuenta>>(`${this.apiUrl}/credenciales/${id}`);
    }

    eliminarCuenta(id: number) {
        return this.httpClient.delete(this.apiUrl + `/credenciales/${id}`, {params: {idCredencial: id}});
    }

    actualizar(credencial: {
        id: number;
        proveedorId: any;
        departamentoId: any;
        unidadId: any;
        usuario: any;
        clave: any;
        comentario: any
    }) {
        return this.httpClient.put<void>(this.apiUrl + `/credenciales/${credencial['id']}`, credencial);
    }

    existeCuenta(idProveedor: number,
                 usuario: number) {
        return this.httpClient.get<boolean>(this.apiUrl + 'credencial/existe', {
            params: {
                idProveedor: idProveedor,
                usuario: usuario,
            },
        });
    }

    registrar(data) {
        return this.httpClient.post<void>(this.apiUrl + '/credenciales', data);
    }
}
