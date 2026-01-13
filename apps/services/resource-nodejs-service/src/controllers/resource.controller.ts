import { FastifyReply, FastifyRequest } from 'fastify';
import { ResourceModel } from '../models/resource.model';

export const listResources = async (_req: FastifyRequest, reply: FastifyReply) => {
  const resources = await ResourceModel.findAll();
  return reply.code(200).send({ success: true, data: resources });
};

export const getResource = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const resource = await ResourceModel.findById(req.params.id);
  if (!resource) {
    return reply.code(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Resource not found', details: [] },
    });
  }
  return reply.code(200).send({ success: true, data: resource });
};

export const createResource = async (
  req: FastifyRequest<{ Body: { title: string; description?: string } }>,
  reply: FastifyReply
) => {
  const { title, description } = req.body;
  const resource = await ResourceModel.create(title, description);
  return reply.code(201).send({ success: true, data: resource });
};

export const updateResource = async (
  req: FastifyRequest<{
    Params: { id: string };
    Body: { title: string; description?: string | null; completed: boolean };
  }>,
  reply: FastifyReply
) => {
  const updated = await ResourceModel.update(req.params.id, req.body);
  if (!updated) {
    return reply.code(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Resource not found', details: [] },
    });
  }
  return reply.code(200).send({ success: true, data: updated });
};

export const toggleResource = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const toggled = await ResourceModel.toggle(req.params.id);
  if (!toggled) {
    return reply.code(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Resource not found', details: [] },
    });
  }
  return reply.code(200).send({ success: true, data: toggled });
};

export const deleteResource = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const ok = await ResourceModel.delete(req.params.id);
  if (!ok) {
    return reply.code(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Resource not found', details: [] },
    });
  }
  return reply.code(204).send();
};
