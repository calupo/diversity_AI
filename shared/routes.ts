import { z } from 'zod';
import { insertTranslationSchema, translations } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  translations: {
    process: {
      method: 'POST' as const,
      path: '/api/translate' as const,
      input: z.object({
        audio: z.string().describe("Base64 encoded audio"),
        autoPlay: z.boolean().default(false),
      }),
      responses: {
        200: z.object({
          original: z.string(),
          berlin: z.string(),
          english: z.string(),
          berlinAudio: z.string().optional(), 
          englishAudio: z.string().optional(),
        }),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
    history: {
      method: 'GET' as const,
      path: '/api/history' as const,
      responses: {
        200: z.array(z.custom<typeof translations.$inferSelect>()),
      },
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type TranslationInput = z.infer<typeof api.translations.process.input>;
export type TranslationResult = z.infer<typeof api.translations.process.responses[200]>;
