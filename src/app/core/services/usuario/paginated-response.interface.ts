export interface PaginatedResponse<T> {
    page: number;
    data: T[];
    hasNext: boolean;
    hasPrevious: boolean;
    size: number;
    totalElements: number;
    totalPages: number;
}
