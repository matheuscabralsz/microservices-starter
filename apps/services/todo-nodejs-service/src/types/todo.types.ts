export interface Todo {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  createdAt: string; // ISO string when returned via API
  updatedAt: string; // ISO string when returned via API
}
