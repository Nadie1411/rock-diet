import { api } from './api';

export const categoryService = {
  getCategories: () => api.get('category'),
  getCategoryById: (id) => api.get(`category/${id}`),
  createCategory: (formData) => api.post('category', formData, { auth: true }),
  updateCategory: (id, formData) => api.patch(`category/${id}`, formData, { auth: true }),
  deleteCategory: (id) => api.delete(`category/${id}`, { auth: true }),
};
