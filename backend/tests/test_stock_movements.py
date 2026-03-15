# tests/test_stock_movements.py


class TestRegisterMovement:

    def test_admin_can_register_entrada(self, client, auth_headers, sample_product):
        """Admin puede registrar un movimiento de entrada."""
        initial_quantity = sample_product.quantity  # 50

        response = client.post("/stock/", json={
            "product_id": sample_product.id,
            "movement_type": "entrada",
            "quantity": 20,
            "note": "Restock"
        }, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["movement_type"] == "entrada"
        assert data["quantity"] == 20
        assert data["product_id"] == sample_product.id
        assert "id" in data
        assert "created_at" in data

    def test_admin_can_register_salida(self, client, auth_headers, sample_product):
        """Admin puede registrar un movimiento de salida."""
        response = client.post("/stock/", json={
            "product_id": sample_product.id,
            "movement_type": "salida",
            "quantity": 10
        }, headers=auth_headers)

        assert response.status_code == 200
        assert response.json()["movement_type"] == "salida"

    def test_entrada_increases_product_quantity(self, client, auth_headers, sample_product, db):
        """Una entrada incrementa el quantity del producto."""
        from app.models.product import Product

        client.post("/stock/", json={
            "product_id": sample_product.id,
            "movement_type": "entrada",
            "quantity": 25
        }, headers=auth_headers)

        db.expire_all()
        updated = db.query(Product).filter(Product.id == sample_product.id).first()
        assert updated.quantity == 75  # 50 + 25

    def test_salida_decreases_product_quantity(self, client, auth_headers, sample_product, db):
        """Una salida decrementa el quantity del producto."""
        from app.models.product import Product

        client.post("/stock/", json={
            "product_id": sample_product.id,
            "movement_type": "salida",
            "quantity": 10
        }, headers=auth_headers)

        db.expire_all()
        updated = db.query(Product).filter(Product.id == sample_product.id).first()
        assert updated.quantity == 40  # 50 - 10

    def test_salida_with_insufficient_stock_returns_400(self, client, auth_headers, sample_product):
        """Salida que supera el stock disponible retorna 400."""
        response = client.post("/stock/", json={
            "product_id": sample_product.id,
            "movement_type": "salida",
            "quantity": 9999
        }, headers=auth_headers)

        assert response.status_code == 400
        assert "Insufficient stock" in response.json()["detail"]

    def test_zero_quantity_returns_400(self, client, auth_headers, sample_product):
        """Cantidad 0 retorna 400."""
        response = client.post("/stock/", json={
            "product_id": sample_product.id,
            "movement_type": "entrada",
            "quantity": 0
        }, headers=auth_headers)
        assert response.status_code == 400

    def test_negative_quantity_returns_400(self, client, auth_headers, sample_product):
        """Cantidad negativa retorna 400."""
        response = client.post("/stock/", json={
            "product_id": sample_product.id,
            "movement_type": "entrada",
            "quantity": -5
        }, headers=auth_headers)
        assert response.status_code == 400

    def test_movement_for_nonexistent_product_returns_404(self, client, auth_headers):
        """Movimiento sobre producto inexistente retorna 404."""
        response = client.post("/stock/", json={
            "product_id": 9999,
            "movement_type": "entrada",
            "quantity": 10
        }, headers=auth_headers)
        assert response.status_code == 404

    def test_regular_user_cannot_register_movement(self, client, regular_headers, sample_product):
        """Usuario regular no puede registrar movimientos (403)."""
        response = client.post("/stock/", json={
            "product_id": sample_product.id,
            "movement_type": "entrada",
            "quantity": 10
        }, headers=regular_headers)
        assert response.status_code == 403

    def test_unauthenticated_cannot_register_movement(self, client, sample_product):
        """Sin token no se pueden registrar movimientos (401)."""
        response = client.post("/stock/", json={
            "product_id": sample_product.id,
            "movement_type": "entrada",
            "quantity": 10
        })
        assert response.status_code == 401


class TestGetMovements:

    def test_admin_can_get_movements_for_product(self, client, auth_headers, sample_product):
        """Admin puede listar movimientos de un producto."""
        # Crear dos movimientos
        client.post("/stock/", json={
            "product_id": sample_product.id,
            "movement_type": "entrada",
            "quantity": 10
        }, headers=auth_headers)
        client.post("/stock/", json={
            "product_id": sample_product.id,
            "movement_type": "salida",
            "quantity": 5
        }, headers=auth_headers)

        response = client.get(f"/stock/{sample_product.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2

    def test_get_movements_for_nonexistent_product_returns_404(self, client, auth_headers):
        """Consultar movimientos de producto inexistente retorna 404."""
        response = client.get("/stock/9999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_movements_empty_list(self, client, auth_headers, sample_product):
        """Producto sin movimientos retorna lista vacía."""
        response = client.get(f"/stock/{sample_product.id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_regular_user_cannot_get_movements(self, client, regular_headers, sample_product):
        """Usuario regular no puede consultar movimientos (403)."""
        response = client.get(f"/stock/{sample_product.id}", headers=regular_headers)
        assert response.status_code == 403