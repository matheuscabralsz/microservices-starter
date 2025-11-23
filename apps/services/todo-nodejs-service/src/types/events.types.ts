export enum TodoEventType {
  TODO_CREATED = 'TODO_CREATED',
  TODO_UPDATED = 'TODO_UPDATED',
  TODO_COMPLETED = 'TODO_COMPLETED',
  TODO_DELETED = 'TODO_DELETED',
}

export interface TodoEventMetadata {
  source: string;
  version: string;
  correlationId?: string;
}

export interface TodoCreatedData {
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string | null;
}

export interface TodoUpdatedData {
  title: string;
  description?: string | null;
  completed: boolean;
  dueDate?: string | null;
}

export interface TodoCompletedData {
  completed: boolean;
  completedAt: string;
}

export interface TodoDeletedData {
  // Empty for deleted events
}

export type TodoEventData =
  | TodoCreatedData
  | TodoUpdatedData
  | TodoCompletedData
  | TodoDeletedData;

export interface TodoEvent {
  eventId: string;
  eventType: TodoEventType;
  timestamp: string;
  userId: string;
  todoId: string;
  data: TodoEventData;
  metadata: TodoEventMetadata;
}
