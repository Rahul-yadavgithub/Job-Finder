const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export const fetchApi = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    // CRITICAL: This ensures the tpr_token cookie is sent with every request
    credentials: 'include',
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(data?.message || 'An error occurred', response.status);
  }

  if (data && data.success === false) {
    throw new ApiError(data.message || 'An error occurred', response.status);
  }

  return data?.data as T;
};

// Handle multipart/form-data for uploads
export const fetchApiFormData = async <T>(endpoint: string, formData: FormData): Promise<T> => {
  const url = `${BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    // Do not set Content-Type header; the browser will automatically set it to multipart/form-data with boundary
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(data?.message || 'Upload failed', response.status);
  }

  return data?.data as T;
};
