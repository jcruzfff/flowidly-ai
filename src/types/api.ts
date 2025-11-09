// Standard API response wrapper
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
}

// API error structure
export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  field?: string
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalPages: number
    totalCount: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

// Pagination params
export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// API request headers
export interface ApiHeaders {
  Authorization?: string
  'Content-Type'?: string
  [key: string]: string | undefined
}

// Upload response
export interface UploadResponse {
  url: string
  path: string
  fileName: string
  fileSize: number
  mimeType: string
}

// Batch operation result
export interface BatchOperationResult<T = any> {
  successful: number
  failed: number
  results: {
    id: string
    success: boolean
    data?: T
    error?: ApiError
  }[]
}

