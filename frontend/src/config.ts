export const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
export const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};
