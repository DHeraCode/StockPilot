import { useState, useCallback } from "react";
import { getMovements, createMovement } from "../api/stockMovements";

export function useStockMovements() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMovements();
      setMovements(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al cargar movimientos");
    } finally {
      setLoading(false);
    }
  }, []);

  const addMovement = async (data) => {
    const created = await createMovement(data);
    setMovements(prev => [created, ...prev]);
    return created;
  };

  return { movements, loading, error, fetchMovements, addMovement };
}