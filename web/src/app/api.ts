// Shared API caller utility supporting dev/prod environment states
export const getApiUrl = (path: string): string => {
  const isDev = process.env.NODE_ENV === 'development';
  // Prepend local Go server in dev, use relative endpoint in production (Nginx proxy)
  const baseUrl = isDev ? 'http://localhost:8080' : '';
  return `${baseUrl}${path}`;
};

// Standardized fetch wrapper that forces session cookies handling
export const apiFetch = async <T = any>(path: string, options: RequestInit = {}): Promise<T> => {
  const url = getApiUrl(path);
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  } as HeadersInit;

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Mandates cookie exchange for JWT security
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
};
