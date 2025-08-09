import {
  CreateManyResponse,
  CreateResponse,
  DataProvider,
  DeleteManyResponse,
  DeleteOneResponse,
  GetListResponse,
  GetManyReferenceResponse,
  GetOneResponse,
  UpdateManyResponse,
  UpdateResponse,
} from "@refinedev/core";
import { supabase, Tables } from "./supabaseClient";

export const dataProvider = (): DataProvider => ({
  getList: async ({ resource, pagination = {}, sort = [], filters, meta }) => {
    const { current = 1, pageSize = 10 } = pagination;
    const from = (current - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from(resource)
      .select("*", { count: "exact" });

    // Apply sorting
    if (sort && sort.length > 0) {
      sort.forEach(({ field, order }) => {
        query = query.order(field as keyof Tables[typeof resource], { ascending: order === "asc" });
      });
    }

    // Apply filters
    if (filters) {
      filters.forEach(({ field, operator, value }) => {
        if (operator === "eq") {
          query = query.eq(field, value);
        } else if (operator === "neq") {
          query = query.neq(field, value);
        } else if (operator === "lt") {
          query = query.lt(field, value);
        } else if (operator === "gt") {
          query = query.gt(field, value);
        } else if (operator === "lte") {
          query = query.lte(field, value);
        } else if (operator === "gte") {
          query = query.gte(field, value);
        } else if (operator === "contains") {
          query = query.ilike(field, `%${value}%`);
        }
      });
    }

    // Apply pagination
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    return {
      data: data || [],
      total: count || 0,
    } as GetListResponse<any>;
  },

  getOne: async ({ resource, id, meta }) => {
    const { data, error } = await supabase
      .from(resource)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    return { data } as GetOneResponse<any>;
  },

  create: async ({ resource, variables, meta }) => {
    const { data, error } = await supabase
      .from(resource)
      .insert(variables)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data } as CreateResponse<any>;
  },

  update: async ({ resource, id, variables, meta }) => {
    const { data, error } = await supabase
      .from(resource)
      .update(variables)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data } as UpdateResponse<any>;
  },

  deleteOne: async ({ resource, id, variables, meta }) => {
    const { error } = await supabase
      .from(resource)
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return { data: { id } } as DeleteOneResponse<any>;
  },

  getApiUrl: () => {
    return ""; // Not used with Supabase
  },

  // Optional: Implement these methods if needed
  createMany: undefined,
  deleteMany: undefined,
  updateMany: undefined,
  getMany: undefined,
  getManyReference: undefined,
});
