import { useState, useCallback } from "react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../api/products";

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al cargar productos");
    } finally {
      setLoading(false);
    }
  }, []);

  const addProduct = async (data) => {
    const created = await createProduct(data);
    setProducts(prev => [created, ...prev]);
    return created;
  };

  const editProduct = async (id, data) => {
    const updated = await updateProduct(id, data);
    setProducts(prev => prev.map(p => p.id === id ? updated : p));
    return updated;
  };

  const removeProduct = async (id) => {
    await deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    editProduct,
    removeProduct,
  };
}