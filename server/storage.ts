import { db } from "./db";
import { translations, type InsertTranslation, type Translation } from "@shared/schema";
import { desc } from "drizzle-orm";

export interface IStorage {
  createTranslation(translation: InsertTranslation): Promise<Translation>;
  getHistory(): Promise<Translation[]>;
}

export class DatabaseStorage implements IStorage {
  async createTranslation(insertTranslation: InsertTranslation): Promise<Translation> {
    const [translation] = await db
      .insert(translations)
      .values(insertTranslation)
      .returning();
    return translation;
  }

  async getHistory(): Promise<Translation[]> {
    return await db
      .select()
      .from(translations)
      .orderBy(desc(translations.createdAt))
      .limit(10); // Limit to last 10 for the prototype
  }
}

export const storage = new DatabaseStorage();
