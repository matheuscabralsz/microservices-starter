import { v4 as uuidv4 } from 'uuid';
import { getKafkaProducer } from '../config/kafka';
import {
  TodoEvent,
  TodoEventType,
  TodoCreatedData,
  TodoUpdatedData,
  TodoCompletedData,
  TodoDeletedData,
} from '../types/events.types';

const KAFKA_TOPIC = process.env.KAFKA_TOPIC_TODO_EVENTS || 'todo-events';
const MOCK_USER_ID = process.env.MOCK_USER_ID || 'mock-user-123';
const SERVICE_NAME = 'todo-nodejs-service';
const EVENT_VERSION = '1.0';

export class EventPublisherService {
  private async publishEvent(event: TodoEvent): Promise<void> {
    try {
      const producer = getKafkaProducer();

      const message = {
        key: event.todoId,
        value: JSON.stringify(event),
        headers: {
          eventType: event.eventType,
          eventId: event.eventId,
          correlationId: event.metadata.correlationId || '',
        },
      };

      await producer.send({
        topic: KAFKA_TOPIC,
        messages: [message],
      });

      console.log(`Event published: ${event.eventType} for todo ${event.todoId}`, {
        eventId: event.eventId,
        eventType: event.eventType,
        todoId: event.todoId,
      });
    } catch (error) {
      console.error('Failed to publish event:', error);
      // Don't throw - log and continue (fire-and-forget pattern)
    }
  }

  async publishTodoCreated(
    todoId: string,
    title: string,
    description?: string,
    dueDate?: Date | null,
    correlationId?: string
  ): Promise<void> {
    const event: TodoEvent = {
      eventId: uuidv4(),
      eventType: TodoEventType.TODO_CREATED,
      timestamp: new Date().toISOString(),
      userId: MOCK_USER_ID,
      todoId,
      data: {
        title,
        description,
        completed: false,
        dueDate: dueDate?.toISOString() || null,
      } as TodoCreatedData,
      metadata: {
        source: SERVICE_NAME,
        version: EVENT_VERSION,
        correlationId,
      },
    };

    await this.publishEvent(event);
  }

  async publishTodoUpdated(
    todoId: string,
    title: string,
    description: string | null | undefined,
    completed: boolean,
    dueDate?: Date | null,
    correlationId?: string
  ): Promise<void> {
    const event: TodoEvent = {
      eventId: uuidv4(),
      eventType: TodoEventType.TODO_UPDATED,
      timestamp: new Date().toISOString(),
      userId: MOCK_USER_ID,
      todoId,
      data: {
        title,
        description,
        completed,
        dueDate: dueDate?.toISOString() || null,
      } as TodoUpdatedData,
      metadata: {
        source: SERVICE_NAME,
        version: EVENT_VERSION,
        correlationId,
      },
    };

    await this.publishEvent(event);
  }

  async publishTodoCompleted(
    todoId: string,
    completed: boolean,
    correlationId?: string
  ): Promise<void> {
    const event: TodoEvent = {
      eventId: uuidv4(),
      eventType: TodoEventType.TODO_COMPLETED,
      timestamp: new Date().toISOString(),
      userId: MOCK_USER_ID,
      todoId,
      data: {
        completed,
        completedAt: new Date().toISOString(),
      } as TodoCompletedData,
      metadata: {
        source: SERVICE_NAME,
        version: EVENT_VERSION,
        correlationId,
      },
    };

    await this.publishEvent(event);
  }

  async publishTodoDeleted(todoId: string, correlationId?: string): Promise<void> {
    const event: TodoEvent = {
      eventId: uuidv4(),
      eventType: TodoEventType.TODO_DELETED,
      timestamp: new Date().toISOString(),
      userId: MOCK_USER_ID,
      todoId,
      data: {} as TodoDeletedData,
      metadata: {
        source: SERVICE_NAME,
        version: EVENT_VERSION,
        correlationId,
      },
    };

    await this.publishEvent(event);
  }
}

export const eventPublisher = new EventPublisherService();
