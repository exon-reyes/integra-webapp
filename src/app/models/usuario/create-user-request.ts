export interface CreateUserRequest {
    username: string;
    password: string;
    email?: string;
    enabled?: boolean;
    roles?: number[];
    permissions?: string[];
}
