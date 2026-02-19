import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type TranslationInput, type TranslationResult } from "@shared/routes";

// Define history item type based on schema
interface HistoryItem {
  id: number;
  originalText: string;
  berlinText: string;
  englishText: string;
  createdAt: string;
}

export function useHistory() {
  return useQuery({
    queryKey: [api.translations.history.path],
    queryFn: async () => {
      const res = await fetch(api.translations.history.path);
      if (!res.ok) throw new Error("Failed to fetch history");
      return await res.json() as HistoryItem[];
    },
  });
}

export function useTranslate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: TranslationInput) => {
      const res = await fetch(api.translations.process.path, {
        method: api.translations.process.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Translation failed");
      }
      
      return await res.json() as TranslationResult;
    },
    onSuccess: () => {
      // Refresh history after a successful translation
      queryClient.invalidateQueries({ queryKey: [api.translations.history.path] });
    },
  });
}
