import client from "./client";

// TODO: connected to GET /products
export const getProducts = () =>
  client.get("/products").then(r => r.data);

// TODO: connected to GET /products/:id
export const getProduct = (id) =>
  client.get(`/products/${id}`).then(r => r.data);

// TODO: connected to POST /products
export const createProduct = (data) =>
  client.post("/products", data).then(r => r.data);

// TODO: connected to PUT /products/:id
export const updateProduct = (id, data) =>
  client.put(`/products/${id}`, data).then(r => r.data);

// TODO: connected to DELETE /products/:id
export const deleteProduct = (id) =>
  client.delete(`/products/${id}`).then(r => r.data);