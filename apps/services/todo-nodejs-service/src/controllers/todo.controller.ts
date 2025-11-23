import { FastifyReply, FastifyRequest } from 'fastify';
import { TodoModel } from '../models/todo.model';
import { eventPublisher } from '../services/event-publisher.service';

export const listTodos = async (_req: FastifyRequest, reply: FastifyReply) => {
  const todos = await TodoModel.findAll();
  return reply.code(200).send({ success: true, data: todos });
};

export const getTodo = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const todo = await TodoModel.findById(req.params.id);
  if (!todo) {
    return reply.code(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Todo not found', details: [] },
    });
  }
  return reply.code(200).send({ success: true, data: todo });
};

export const createTodo = async (
  req: FastifyRequest<{ Body: { title: string; description?: string } }>,
  reply: FastifyReply
) => {
  const { title, description } = req.body;
  const todo = await TodoModel.create(title, description);

  // Publish event after successful creation
  await eventPublisher.publishTodoCreated(
    todo.id,
    todo.title,
    todo.description,
    null,
    req.id
  );

  return reply.code(201).send({ success: true, data: todo });
};

export const updateTodo = async (
  req: FastifyRequest<{
    Params: { id: string };
    Body: { title: string; description?: string | null; completed: boolean };
  }>,
  reply: FastifyReply
) => {
  const updated = await TodoModel.update(req.params.id, req.body);
  if (!updated) {
    return reply.code(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Todo not found', details: [] },
    });
  }

  // Publish event after successful update
  await eventPublisher.publishTodoUpdated(
    updated.id,
    updated.title,
    updated.description,
    updated.completed,
    null,
    req.id
  );

  return reply.code(200).send({ success: true, data: updated });
};

export const toggleTodo = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const toggled = await TodoModel.toggle(req.params.id);
  if (!toggled) {
    return reply.code(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Todo not found', details: [] },
    });
  }

  // Publish completion event
  await eventPublisher.publishTodoCompleted(
    toggled.id,
    toggled.completed,
    req.id
  );

  return reply.code(200).send({ success: true, data: toggled });
};

export const deleteTodo = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const ok = await TodoModel.delete(req.params.id);
  if (!ok) {
    return reply.code(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Todo not found', details: [] },
    });
  }

  // Publish deletion event
  await eventPublisher.publishTodoDeleted(req.params.id, req.id);

  return reply.code(204).send();
};
