import { pool } from '../config/database';
import type { Resource } from '../types/resource.types';

export class ResourceModel {
  static async findAll(): Promise<Resource[]> {
    const { rows } = await pool.query(
      `SELECT id, title, description, completed,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM resources ORDER BY created_at DESC`
    );
    return rows.map(ResourceModel.toApi);
  }

  static async findById(id: string): Promise<Resource | null> {
    const { rows } = await pool.query(
      `SELECT id, title, description, completed,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM resources WHERE id = $1`,
      [id]
    );
    return rows[0] ? ResourceModel.toApi(rows[0]) : null;
  }

  static async create(title: string, description?: string | null): Promise<Resource> {
    const { rows } = await pool.query(
      `INSERT INTO resources (title, description)
       VALUES ($1, $2)
       RETURNING id, title, description, completed,
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [title, description ?? null]
    );
    return ResourceModel.toApi(rows[0]);
  }

  static async update(
    id: string,
    data: { title: string; description?: string | null; completed: boolean }
  ): Promise<Resource | null> {
    const { rows } = await pool.query(
      `UPDATE resources
       SET title = $2,
           description = $3,
           completed = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, title, description, completed,
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [id, data.title, data.description ?? null, data.completed]
    );
    return rows[0] ? ResourceModel.toApi(rows[0]) : null;
  }

  static async toggle(id: string): Promise<Resource | null> {
    const { rows } = await pool.query(
      `UPDATE resources
       SET completed = NOT completed,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, title, description, completed,
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [id]
    );
    return rows[0] ? ResourceModel.toApi(rows[0]) : null;
  }

  static async delete(id: string): Promise<boolean> {
    const { rowCount } = await pool.query(`DELETE FROM resources WHERE id = $1`, [id]);
    return (rowCount ?? 0) > 0;
  }

  private static toApi(row: any): Resource {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      completed: row.completed,
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
    };
  }
}
