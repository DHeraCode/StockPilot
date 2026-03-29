import client from "./client";

// TODO: connected to GET /stock-movements
export const getMovements = () =>
  client.get("/stock-movements").then(r => r.data);

// TODO: connected to POST /stock-movements
export const createMovement = (data) =>
  client.post("/stock-movements", data).then(r => r.data);