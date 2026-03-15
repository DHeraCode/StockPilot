# tests/test_categories.py


class TestCreateCategory:

    def test_admin_can_create_category(self, client, auth_headers):
        """Admin puede crear una categoría."""
        response = client.post("/categories/", json={
            "name": "Electronics",
            "description": "Electronic devices"
        }, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Electronics"
        assert data["description"] == "Electronic devices"
        assert "id" in data

    def test_admin_can_create_category_without_description(self, client, auth_headers):
        """Admin puede crear una categoría sin descripción."""
        response = client.post("/categories/", json={
            "name": "Furniture"
        }, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["name"] == "Furniture"

    def test_regular_user_cannot_create_category(self, client, regular_headers):
        """Usuario regular no puede crear categorías (403)."""
        response = client.post("/categories/", json={
            "name": "Forbidden"
        }, headers=regular_headers)
        assert response.status_code == 403

    def test_unauthenticated_cannot_create_category(self, client):
        """Sin token no se puede crear categorías (401)."""
        response = client.post("/categories/", json={"name": "NoAuth"})
        assert response.status_code == 401

    def test_duplicate_category_name_returns_400(self, client, auth_headers):
        """Nombre de categoría duplicado retorna 400."""
        client.post("/categories/", json={"name": "Duplicate"}, headers=auth_headers)
        response = client.post("/categories/", json={"name": "Duplicate"}, headers=auth_headers)
        assert response.status_code == 400


class TestGetCategories:

    def test_authenticated_user_can_list_categories(self, client, regular_headers, sample_category):
        """Usuario autenticado puede listar categorías."""
        response = client.get("/categories/", headers=regular_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["name"] == "Electronics"

    def test_unauthenticated_cannot_list_categories(self, client):
        """Sin token no se pueden listar categorías (401)."""
        response = client.get("/categories/")
        assert response.status_code == 401

    def test_empty_categories_returns_empty_list(self, client, regular_headers):
        """Sin categorías retorna lista vacía."""
        response = client.get("/categories/", headers=regular_headers)
        assert response.status_code == 200
        assert response.json() == []


class TestDeleteCategory:

    def test_admin_can_delete_category(self, client, auth_headers, sample_category):
        """Admin puede eliminar una categoría."""
        response = client.delete(f"/categories/{sample_category.id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["detail"] == "Category deleted successfully"

    def test_delete_nonexistent_category_returns_404(self, client, auth_headers):
        """Eliminar categoría inexistente retorna 404."""
        response = client.delete("/categories/9999", headers=auth_headers)
        assert response.status_code == 404

    def test_regular_user_cannot_delete_category(self, client, regular_headers, sample_category):
        """Usuario regular no puede eliminar categorías (403)."""
        response = client.delete(f"/categories/{sample_category.id}", headers=regular_headers)
        assert response.status_code == 403