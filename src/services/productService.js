import { api } from './api';

export const productService = {
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    if (params.categoryId) query.append('categoryId', params.categoryId);
    if (params.minPrice !== undefined && params.minPrice !== '') query.append('minPrice', params.minPrice);
    if (params.maxPrice !== undefined && params.maxPrice !== '') query.append('maxPrice', params.maxPrice);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    
    const queryString = query.toString();
    const path = queryString ? `product?${queryString}` : 'product';
    return api.get(path);
  },
  getProductById: (id) => api.get(`product/${id}`),
  createProduct: (formData) => api.post('product', formData, { auth: true }),
  updateProduct: (id, formData) => api.patch(`product/${id}`, formData, { auth: true }),
  deleteProduct: (id) => api.delete(`product/${id}`, { auth: true }),
};
