# tests/test_auth.py

class TestRegister:

    def test_register_first_user_becomes_admin(self, client):
        """El primer usuario registrado obtiene is_admin=True automáticamente."""
        response = client.post("/auth/register", json={
            "username": "firstuser",
            "email": "first@test.com",
            "password": "password123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "firstuser"
        assert data["is_admin"] is True

    def test_register_second_user_is_not_admin(self, client):
        """Los usuarios subsiguientes no son admin."""
        client.post("/auth/register", json={
            "username": "firstuser",
            "email": "first@test.com",
            "password": "password123"
        })
        response = client.post("/auth/register", json={
            "username": "seconduser",
            "email": "second@test.com",
            "password": "password123"
        })
        assert response.status_code == 200
        assert response.json()["is_admin"] is False

    def test_register_duplicate_username_returns_409(self, client):
        """Registrar con username duplicado retorna 409."""
        payload = {"username": "dupeuser", "email": "a@test.com", "password": "password123"}
        client.post("/auth/register", json=payload)
        response = client.post("/auth/register", json={
            "username": "dupeuser",
            "email": "b@test.com",
            "password": "password123"
        })
        assert response.status_code == 409

    def test_register_duplicate_email_returns_409(self, client):
        """Registrar con email duplicado retorna 409."""
        client.post("/auth/register", json={
            "username": "user1",
            "email": "same@test.com",
            "password": "password123"
        })
        response = client.post("/auth/register", json={
            "username": "user2",
            "email": "same@test.com",
            "password": "password123"
        })
        # Ahora que el limitador está OFF, esto dará 409 en lugar de 429
        assert response.status_code == 409

    def test_register_short_password_returns_422(self, client):
        """Contraseña menor a 8 caracteres retorna 422."""
        response = client.post("/auth/register", json={
            "username": "user1",
            "email": "user1@test.com",
            "password": "short"
        })
        assert response.status_code == 422

    def test_register_short_username_returns_422(self, client):
        """Username menor a 3 caracteres retorna 422."""
        response = client.post("/auth/register", json={
            "username": "ab",
            "email": "user@test.com",
            "password": "password123"
        })
        assert response.status_code == 422

    def test_register_invalid_email_returns_422(self, client):
        """Email inválido retorna 422."""
        response = client.post("/auth/register", json={
            "username": "validuser",
            "email": "not-an-email",
            "password": "password123"
        })
        assert response.status_code == 422


class TestLogin:

    def test_login_success_returns_token(self, client, admin_user):
        """Login exitoso retorna access_token y token_type."""
        response = client.post("/auth/login", data={
            "username": "admin",
            "password": "adminpass123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password_returns_400(self, client, admin_user):
        """Contraseña incorrecta retorna 400."""
        response = client.post("/auth/login", data={
            "username": "admin",
            "password": "wrongpassword"
        })
        assert response.status_code == 400

    def test_login_nonexistent_user_returns_400(self, client):
        """Usuario inexistente retorna 400."""
        response = client.post("/auth/login", data={
            "username": "ghost",
            "password": "password123"
        })
        assert response.status_code == 400


class TestMe:

    def test_get_me_returns_current_user(self, client, auth_headers, admin_user):
        """GET /auth/me retorna los datos del usuario autenticado."""
        response = client.get("/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "admin"
        assert data["email"] == "admin@test.com"

    def test_get_me_without_token_returns_401(self, client):
        """GET /auth/me sin token retorna 401."""
        response = client.get("/auth/me")
        assert response.status_code == 401

    def test_get_me_invalid_token_returns_401(self, client):
        """GET /auth/me con token inválido retorna 401."""
        response = client.get("/auth/me", headers={"Authorization": "Bearer invalidtoken"})
        assert response.status_code == 401