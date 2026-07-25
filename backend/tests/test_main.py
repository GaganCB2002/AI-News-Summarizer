"""Comprehensive test suite for the AI News Summarizer backend."""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.session import init_db, close_db


@pytest_asyncio.fixture
async def client():
    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    await close_db()


# ─── Health & Status ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health_endpoint(client):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_root_endpoint(client):
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data


# ─── Authentication ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_register_and_login(client):
    email = "test_integration@example.com"
    username = "test_integration"
    register_res = await client.post("/api/v1/auth/register", json={
        "email": email,
        "username": username,
        "password": "testpassword123",
        "full_name": "Test Integration",
    })
    assert register_res.status_code in (201, 409)

    login_res = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "testpassword123",
    })
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_login_invalid_credentials(client):
    response = await client.post("/api/v1/auth/login", json={
        "email": "nonexistent@test.com",
        "password": "wrongpassword",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_unauthorized(client):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 403


# ─── News Endpoints ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_categories(client):
    response = await client.get("/api/v1/news/categories")
    assert response.status_code == 200
    data = response.json()
    assert "categories" in data
    assert len(data["categories"]) > 0


@pytest.mark.asyncio
async def test_list_countries(client):
    response = await client.get("/api/v1/news/countries")
    assert response.status_code == 200
    data = response.json()
    assert "countries" in data


@pytest.mark.asyncio
async def test_list_articles(client):
    response = await client.get("/api/v1/news?page=1&page_size=5")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_get_article_not_found(client):
    response = await client.get("/api/v1/news/nonexistent-id")
    assert response.status_code == 404


# ─── Analytics ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_analytics_requires_auth(client):
    response = await client.get("/api/v1/analytics/stats")
    assert response.status_code == 403


# ─── Protected Endpoints ────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_protected_endpoints_require_auth(client):
    endpoints = [
        ("GET", "/api/v1/preferences"),
        ("PUT", "/api/v1/preferences"),
        ("GET", "/api/v1/bookmarks"),
        ("GET", "/api/v1/history/reading"),
        ("GET", "/api/v1/summaries"),
        ("GET", "/api/v1/analytics/me"),
        ("GET", "/api/v1/admin/users"),
    ]
    for method, path in endpoints:
        if method == "GET":
            response = await client.get(path)
        elif method == "PUT":
            response = await client.put(path, json={})
        else:
            continue
        assert response.status_code in (401, 403, 422), f"{method} {path} returned {response.status_code}"


# ─── API Structure Validation ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_api_docs_available(client):
    response = await client.get("/docs")
    assert response.status_code in (200, 307)


# ─── CORS Headers ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_cors_headers(client):
    response = await client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert "access-control-allow-origin" in response.headers
