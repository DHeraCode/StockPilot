# tests/test_products.py


class TestCreateProduct:

    def test_authenticated_user_can_create_product(self, client, auth_headers, sample_category):
        """Usuario autenticado puede crear un producto."""
        response = client.post("/products/", json={
            "name": "Laptop",
            "description": "A powerful laptop",
            "price": 999.99,
            "quantity": 10,
            "category_id": sample_category.id
        }, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Laptop"
        assert data["price"] == 999.99
        assert data["quantity"] == 10
        assert "id" in data
        assert "owner_id" in data

    def test_create_product_with_invalid_category_returns_404(self, client, auth_headers):
        """Crear producto con categoría inexistente retorna 404."""
        response = client.post("/products/", json={
            "name": "Ghost Product",
            "description": "No category",
            "price": 10.0,
            "quantity": 5,
            "category_id": 9999
        }, headers=auth_headers)
        assert response.status_code == 404

    def test_unauthenticated_cannot_create_product(self, client, sample_category):
        """Sin token no se puede crear productos (401)."""
        response = client.post("/products/", json={
            "name": "NoAuth",
            "description": "desc",
            "price": 1.0,
            "quantity": 1,
            "category_id": sample_category.id
        })
        assert response.status_code == 401


class TestGetProducts:

    def test_get_products_returns_only_own_products(self, client, auth_headers, regular_headers, sample_category, db):
        """Cada usuario solo ve sus propios productos."""
        # Admin crea un producto
        client.post("/products/", json={
            "name": "Admin Product",
            "description": "desc",
            "price": 10.0,
            "quantity": 5,
            "category_id": sample_category.id
        }, headers=auth_headers)

        # Regular crea un producto
        client.post("/products/", json={
            "name": "Regular Product",
            "description": "desc",
            "price": 20.0,
            "quantity": 3,
            "category_id": sample_category.id
        }, headers=regular_headers)

        admin_response = client.get("/products/", headers=auth_headers)
        regular_response = client.get("/products/", headers=regular_headers)

        assert admin_response.json()["total"] == 1
        assert admin_response.json()["items"][0]["name"] == "Admin Product"

        assert regular_response.json()["total"] == 1
        assert regular_response.json()["items"][0]["name"] == "Regular Product"

    def test_get_products_returns_paginated_response(self, client, auth_headers, sample_product):
        """GET /products/ retorna estructura paginada correcta."""
        response = client.get("/products/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "skip" in data
        assert "limit" in data
        assert "items" in data
        assert data["total"] == 1

    def test_get_products_search_filter(self, client, auth_headers, sample_category):
        """El parámetro search filtra productos por nombre."""
        client.post("/products/", json={
            "name": "Alpha Widget",
            "description": "desc",
            "price": 5.0,
            "quantity": 10,
            "category_id": sample_category.id
        }, headers=auth_headers)
        client.post("/products/", json={
            "name": "Beta Gadget",
            "description": "desc",
            "price": 5.0,
            "quantity": 10,
            "category_id": sample_category.id
        }, headers=auth_headers)

        response = client.get("/products/?search=alpha", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["name"] == "Alpha Widget"

    def test_get_products_empty_returns_zero_total(self, client, auth_headers):
        """Sin productos retorna total=0 e items vacío."""
        response = client.get("/products/", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["total"] == 0
        assert response.json()["items"] == []

    def test_unauthenticated_cannot_get_products(self, client):
        """Sin token no se pueden listar productos (401)."""
        response = client.get("/products/")
        assert response.status_code == 401


class TestUpdateProduct:

    def test_owner_can_update_product(self, client, auth_headers, sample_product):
        """El dueño puede actualizar su producto."""
        response = client.put(f"/products/{sample_product.id}", json={
            "name": "Updated Name",
            "price": 149.99
        }, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["price"] == 149.99
        # quantity no se envió, debe mantenerse
        assert data["quantity"] == sample_product.quantity

    def test_update_nonexistent_product_returns_404(self, client, auth_headers):
        """Actualizar producto inexistente retorna 404."""
        response = client.put("/products/9999", json={"name": "Ghost"}, headers=auth_headers)
        assert response.status_code == 404

    def test_non_owner_cannot_update_product(self, client, regular_headers, sample_product):
        """Un usuario no puede actualizar el producto de otro (404 por owner filter)."""
        response = client.put(f"/products/{sample_product.id}", json={
            "name": "Hijacked"
        }, headers=regular_headers)
        assert response.status_code == 404


class TestDeleteProduct:

    def test_owner_can_delete_product(self, client, auth_headers, sample_product):
        """El dueño puede eliminar su producto."""
        response = client.delete(f"/products/{sample_product.id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["detail"] == "Product deleted successfully"

    def test_delete_nonexistent_product_returns_404(self, client, auth_headers):
        """Eliminar producto inexistente retorna 404."""
        response = client.delete("/products/9999", headers=auth_headers)
        assert response.status_code == 404

    def test_non_owner_cannot_delete_product(self, client, regular_headers, sample_product):
        """Un usuario no puede eliminar el producto de otro (403)."""
        response = client.delete(f"/products/{sample_product.id}", headers=regular_headers)
        assert response.status_code == 403


class TestLowStockAlert:

    def test_low_stock_returns_products_below_threshold(self, client, auth_headers, sample_category):
        """Retorna productos cuyo quantity <= threshold."""
        # Producto con stock bajo
        client.post("/products/", json={
            "name": "Low Stock Item",
            "description": "desc",
            "price": 5.0,
            "quantity": 3,
            "category_id": sample_category.id
        }, headers=auth_headers)
        # Producto con stock normal
        client.post("/products/", json={
            "name": "Normal Stock Item",
            "description": "desc",
            "price": 5.0,
            "quantity": 100,
            "category_id": sample_category.id
        }, headers=auth_headers)

        response = client.get("/products/alerts/low-stock?threshold=10", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Low Stock Item"

    def test_low_stock_empty_when_all_above_threshold(self, client, auth_headers, sample_product):
        """Retorna lista vacía si todos los productos superan el umbral."""
        # sample_product tiene quantity=50
        response = client.get("/products/alerts/low-stock?threshold=10", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []