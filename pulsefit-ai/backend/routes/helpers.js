import { Router } from 'express';
export const route = () => Router();
export const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export const pageParams = q => ({
  page: Math.max(1, Number(q.page) || 1),
  limit: Math.min(50, Math.max(1, Number(q.limit) || 10))
});
export const paginate = async (Model, filter, q, sort = {
  createdAt: -1
}) => {
  const {
    page,
    limit
  } = pageParams(q);
  const [items, total] = await Promise.all([Model.find(filter).sort(sort).skip((page - 1) * limit).limit(limit), Model.countDocuments(filter)]);
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};
export const day = () => new Date().toISOString().slice(0, 10);
