export const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'https://ai-news-summarizer-s0q8.onrender.com';
export const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};
