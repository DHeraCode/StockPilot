import client from "./client";

export const getProducts = () =>
  client.get("/products").then(r => r.data.items);

export const getProduct = (id) =>
  client.get(`/products/${id}`).then(r => r.data);

export const createProduct = (data) =>
  client.post("/products", {
    name:        data.name,
    description: data.description,
    price:       Number(data.price),
    quantity:    parseInt(data.quantity, 10),
    category_id: parseInt(data.category_id, 10),
  }).then(r => r.data);

export const updateProduct = (id, data) =>
  client.put(`/products/${id}`, {
    name:        data.name,
    description: data.description,
    price:       Number(data.price),
    quantity:    parseInt(data.quantity, 10),
    category_id: parseInt(data.category_id, 10),
  }).then(r => r.data);

export const deleteProduct = (id) =>
  client.delete(`/products/${id}`).then(r => r.data);