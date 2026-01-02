import { db, handleDbError } from '../client';
import { logger } from '../../core/errors';
import type { PaginatedResult } from '../types';

export interface QueryOptions {
  filters?: Record<string, unknown>;
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
  offset?: number;
  select?: string;
}

type TableName =
  | 'stories'
  | 'storyNodes'
  | 'storyChoices'
  | 'storyComments'
  | 'storyReactions'
  | 'userProfiles'
  | 'userFollows'
  | 'interactiveContent'
  | 'musicContent'
  | 'userStoryProgress';

/**
 * Abstract base repository with common CRUD operations
 */
export abstract class BaseRepository<T extends { id: string }> {
  protected abstract tableName: TableName;
  protected abstract defaultSelect: string;

  /**
   * Get the table query builder
   */
  protected getTable() {
    return db[this.tableName]();
  }

  /**
   * Find a single record by ID
   */
  async findById(id: string): Promise<T | null> {
    try {
      const { data, error } = await this.getTable()
        .select(this.defaultSelect)
        .eq('id', id)
        .maybeSingle();

      if (error) throw handleDbError(error);
      return data as T | null;
    } catch (error) {
      logger.error(`${this.tableName}.findById failed`, error as Error, { id });
      throw error;
    }
  }

  /**
   * Find multiple records with pagination
   */
  async findMany(options: QueryOptions = {}): Promise<PaginatedResult<T>> {
    const {
      filters = {},
      orderBy = 'created_at',
      ascending = false,
      limit = 20,
      offset = 0,
      select = this.defaultSelect,
    } = options;

    try {
      // Build query
      let query = this.getTable().select(select, { count: 'exact' });

      // Apply filters
      for (const [key, value] of Object.entries(filters)) {
        if (value === null) {
          query = query.is(key, null);
        } else if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value as string | number | boolean);
        }
      }

      // Apply ordering and pagination
      query = query.order(orderBy, { ascending }).range(offset, offset + limit);

      const { data, error, count } = await query;

      if (error) throw handleDbError(error);

      return {
        data: (data || []) as unknown as T[],
        hasMore: (data?.length || 0) > limit,
        total: count || 0,
      };
    } catch (error) {
      logger.error(`${this.tableName}.findMany failed`, error as Error, { options });
      throw error;
    }
  }

  /**
   * Create a new record
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const table = this.getTable() as any;
      const { data: result, error } = await table
        .insert(data as Record<string, unknown>)
        .select(this.defaultSelect)
        .single();

      if (error) throw handleDbError(error);
      if (!result) throw new Error('Failed to create record');

      return result as T;
    } catch (error) {
      logger.error(`${this.tableName}.create failed`, error as Error);
      throw error;
    }
  }

  /**
   * Update a record by ID
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const table = this.getTable() as any;
      const { data: result, error } = await table
        .update(data as Record<string, unknown>)
        .eq('id', id)
        .select(this.defaultSelect)
        .single();

      if (error) throw handleDbError(error);
      if (!result) throw new Error('Failed to update record');

      return result as T;
    } catch (error) {
      logger.error(`${this.tableName}.update failed`, error as Error, { id });
      throw error;
    }
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await this.getTable().delete().eq('id', id);

      if (error) throw handleDbError(error);
    } catch (error) {
      logger.error(`${this.tableName}.delete failed`, error as Error, { id });
      throw error;
    }
  }
}
