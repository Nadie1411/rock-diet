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
  /**
   * The whole catalogue, in the same `{ data }` shape as one page.
   *
   * `/product` paginates and reports no total, so pages are pulled until one
   * comes back short — the same loop the app runs. A single `limit: 100`
   * used to be the whole menu; a menu imported from the kitchen's
   * spreadsheet is three times that, and a meal past the first page was
   * simply not on the site.
   */
  getAllProducts: async () => {
    const pageSize = 100;
    const data = [];
    for (let page = 1; page <= 20; page++) {
      const res = await api.get(`product?page=${page}&limit=${pageSize}`);
      const batch = res.data || [];
      data.push(...batch);
      if (batch.length < pageSize) break;
    }
    return { data };
  },

  /**
   * Units sold over paid orders in the last 30 days, falling back to newest
   * products so the shelf is never blank.
   */
  getPopular: () => api.get('product/popular'),

  getProductById: (id) => api.get(`product/${id}`),
  createProduct: (formData) => api.post('product', formData, { auth: true }),
  updateProduct: (id, formData) => api.patch(`product/${id}`, formData, { auth: true }),
  deleteProduct: (id) => api.delete(`product/${id}`, { auth: true }),
};
