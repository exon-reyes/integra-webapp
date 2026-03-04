export interface ResponseData<T> {
    success?: boolean;
    data?: T;
    message?: string;
    timestamp?: string;
    meta?: { [key: string]: any };
}
