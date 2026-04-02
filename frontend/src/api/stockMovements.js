import client from "./client";

export const getMovements = () =>
  client.get("/stock/").then(r => r.data);

export const createMovement = (data) =>
  client.post("/stock/", {
    product_id:    parseInt(data.product_id, 10),
    movement_type: data.movement_type,
    quantity:      parseInt(data.quantity, 10),
    note:          data.note || "",
  }).then(r => r.data);