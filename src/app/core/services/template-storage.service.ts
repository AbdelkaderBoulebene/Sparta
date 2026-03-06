import { Injectable, signal } from '@angular/core';
import { getSpartaDb } from './sparta-db';
import { SessionTemplate } from '../models/session-template.model';

const STORE = 'templates';

@Injectable({ providedIn: 'root' })
export class TemplateStorageService {
  readonly templates = signal<SessionTemplate[]>([]);

  async init(): Promise<void> {
    await this.loadAll();
  }

  async loadAll(): Promise<void> {
    const db = await getSpartaDb();
    const all: SessionTemplate[] = await db.getAll(STORE);
    all.sort((a, b) => a.createdAt - b.createdAt);
    this.templates.set(all);
  }

  async save(template: SessionTemplate): Promise<number> {
    const db = await getSpartaDb();
    const now = Date.now();
    const id = await db.add(STORE, { ...template, createdAt: now, updatedAt: now });
    await this.loadAll();
    return id as number;
  }

  async update(template: SessionTemplate): Promise<void> {
    const db = await getSpartaDb();
    await db.put(STORE, { ...template, updatedAt: Date.now() });
    await this.loadAll();
  }

  async delete(id: number): Promise<void> {
    const db = await getSpartaDb();
    await db.delete(STORE, id);
    await this.loadAll();
  }

  async getById(id: number): Promise<SessionTemplate | undefined> {
    const db = await getSpartaDb();
    return db.get(STORE, id);
  }
}
