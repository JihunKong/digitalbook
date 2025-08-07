import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Textbook {
  id: string;
  title: string;
  subject: string;
  grade: number;
  content: any;
  coverImage?: string;
  isPublished: boolean;
  aiSettings: any;
  createdAt: string;
  updatedAt: string;
}

export function useTextbook(textbookId: string) {
  const [textbook, setTextbook] = useState<Textbook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTextbook();
  }, [textbookId]);

  const fetchTextbook = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/textbooks/${textbookId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch textbook');
      }
      
      const data = await response.json();
      setTextbook(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('교과서를 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTextbook = (updatedTextbook: Textbook) => {
    setTextbook(updatedTextbook);
  };

  return {
    textbook,
    updateTextbook,
    isLoading,
    error,
    refetch: fetchTextbook,
  };
}