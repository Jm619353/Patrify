export interface ApiEnvelope<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Paginated<T> {
  data: T;
  meta: PaginationMeta;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

export interface ApiErrorBody {
  error: ApiErrorPayload;
  requestId?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string = 'UNKNOWN_ERROR',
    public readonly details: Array<{ field: string; message: string }> = []
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
