"""
Comprehensive endpoint test suite for AI News Summarizer.
Tests every registered endpoint and reports failures.
"""
import asyncio
import httpx
import sys
import traceback

BASE = "http://localhost:8000"
results = {"pass": 0, "fail": 0, "errors": []}


def report(name: str, status: int, expected: range = None):
    if expected is None:
        expected = range(200, 300)
    if status in expected:
        results["pass"] += 1
        print(f"  PASS  {status} {name}")
    else:
        results["fail"] += 1
        msg = f"  FAIL  {status} {name}"
        results["errors"].append(msg)
        print(msg)


async def main():
    async with httpx.AsyncClient(base_url=BASE, timeout=30) as c:
        # ---- Health ----
        print("\n=== HEALTH ===")
        r = await c.get("/")
        report("GET /", r.status_code)
        r = await c.get("/health")
        report("GET /health", r.status_code)

        # ---- Auth ----
        print("\n=== AUTH ===")
        r = await c.post("/api/v1/auth/register", json={
            "email": "test@endpoints.com",
            "username": "endpointtest",
            "password": "testpass123",
            "full_name": "Test User",
        })
        report("POST /auth/register", r.status_code, expected=range(200, 400))

        r = await c.post("/api/v1/auth/login", json={
            "email": "test@endpoints.com",
            "password": "testpass123",
        })
        report("POST /auth/login", r.status_code)
        token = r.json().get("access_token", "") if r.status_code == 200 else ""

        r = await c.post("/api/v1/auth/test-login")
        report("POST /auth/test-login", r.status_code)
        if r.status_code == 200:
            token = r.json().get("access_token", token)

        headers = {"Authorization": f"Bearer {token}"} if token else {}

        r = await c.get("/api/v1/auth/me", headers=headers)
        report("GET /auth/me (with token)", r.status_code)

        r = await c.get("/api/v1/auth/me")
        report("GET /auth/me (no token)", r.status_code, expected=[401, 403])

        r = await c.post("/api/v1/auth/refresh", json={"refresh_token": ""})
        report("POST /auth/refresh (invalid)", r.status_code, expected=[401, 422])

        r = await c.post("/api/v1/auth/logout", headers=headers)
        report("POST /auth/logout", r.status_code)

        r = await c.post("/api/v1/auth/change-password", headers=headers, json={
            "current_password": "testpassword123",
            "new_password": "newpass1234",
        })
        report("POST /auth/change-password", r.status_code)

        r = await c.post("/api/v1/auth/forgot-password", json={"email": "test@endpoints.com"})
        report("POST /auth/forgot-password", r.status_code)

        r = await c.post("/api/v1/auth/reset-password", json={
            "token": "invalid",
            "new_password": "newpass1234",
        })
        report("POST /auth/reset-password (invalid token)", r.status_code, expected=[401, 422])

        # ---- News ----
        print("\n=== NEWS ===")
        r = await c.get("/api/v1/news")
        report("GET /news", r.status_code)

        r = await c.get("/api/v1/news", params={"page": 1, "page_size": 5})
        report("GET /news (paginated)", r.status_code)

        r = await c.get("/api/v1/news/trending")
        report("GET /news/trending", r.status_code)

        r = await c.get("/api/v1/news/categories")
        report("GET /news/categories", r.status_code)

        r = await c.get("/api/v1/news/search", params={"q": "tech"}, headers=headers)
        report("GET /news/search", r.status_code)

        r = await c.get("/api/v1/news", params={"category": "Technology"})
        report("GET /news (filter by category)", r.status_code)

        r = await c.get("/api/v1/news", params={"source": "test"})
        report("GET /news (filter by source)", r.status_code)

        r = await c.get("/api/v1/news", params={"language": "en"})
        report("GET /news (filter by language)", r.status_code)

        r = await c.get("/api/v1/news", params={"country": "us"})
        report("GET /news (filter by country)", r.status_code)

        # Get an article ID for detail tests
        article_id = None
        r = await c.get("/api/v1/news", params={"page": 1, "page_size": 1})
        if r.status_code == 200:
            items = r.json().get("items", [])
            if items:
                article_id = items[0]["id"]

        if article_id:
            r = await c.get(f"/api/v1/news/{article_id}")
            report("GET /news/{id}", r.status_code)

            r = await c.get(f"/api/v1/news/{article_id}/summary")
            report("GET /news/{id}/summary", r.status_code, expected=range(200, 500))

            r = await c.post(f"/api/v1/news/{article_id}/summarize", headers=headers)
            report("POST /news/{id}/summarize", r.status_code, expected=range(200, 500))

        r = await c.get("/api/v1/news/invalid-id-12345")
        report("GET /news/invalid-id (404)", r.status_code, expected=[404])

        # ---- Summaries ----
        print("\n=== SUMMARIES ===")
        r = await c.get("/api/v1/summaries", headers=headers)
        report("GET /summaries", r.status_code)

        if article_id:
            r = await c.post("/api/v1/summaries/bullet", headers=headers, json={
                "article_id": article_id,
            })
            report("POST /summaries/bullet", r.status_code, expected=range(200, 500))

            r = await c.post("/api/v1/summaries/keywords", headers=headers, json={
                "article_id": article_id,
            })
            report("POST /summaries/keywords", r.status_code, expected=range(200, 500))

            r = await c.post("/api/v1/summaries/sentiment", headers=headers, json={
                "article_id": article_id,
            })
            report("POST /summaries/sentiment", r.status_code, expected=range(200, 500))

            r = await c.post("/api/v1/summaries/reading-time", headers=headers, json={
                "article_id": article_id,
            })
            report("POST /summaries/reading-time", r.status_code, expected=range(200, 500))

            r = await c.post("/api/v1/summaries/batch", headers=headers, json={
                "article_ids": [article_id],
            })
            report("POST /summaries/batch", r.status_code, expected=range(200, 500))

        # ---- Bookmarks ----
        print("\n=== BOOKMARKS ===")
        r = await c.get("/api/v1/bookmarks", headers=headers)
        report("GET /bookmarks", r.status_code)

        if article_id:
            r = await c.post("/api/v1/bookmarks", headers=headers, json={
                "article_id": article_id,
            })
            report("POST /bookmarks", r.status_code, expected=[201, 409])

            if r.status_code == 201:
                bm_id = r.json().get("id", "")
                r = await c.delete(f"/api/v1/bookmarks/{bm_id}", headers=headers)
                report("DELETE /bookmarks/{id}", r.status_code, expected=[204])

        r = await c.delete("/api/v1/bookmarks/invalid-id", headers=headers)
        report("DELETE /bookmarks/invalid-id", r.status_code, expected=[404])

        # ---- History ----
        print("\n=== HISTORY ===")
        r = await c.get("/api/v1/history/reading", headers=headers)
        report("GET /history/reading", r.status_code)

        r = await c.get("/api/v1/history/search", headers=headers)
        report("GET /history/search", r.status_code)

        r = await c.get("/api/v1/history/summary", headers=headers)
        report("GET /history/summary", r.status_code)

        if article_id:
            r = await c.post(f"/api/v1/history/reading/{article_id}", headers=headers)
            report("POST /history/reading/{id}", r.status_code)

        # ---- Preferences ----
        print("\n=== PREFERENCES ===")
        r = await c.get("/api/v1/preferences", headers=headers)
        report("GET /preferences", r.status_code)

        r = await c.put("/api/v1/preferences", headers=headers, json={
            "categories": ["Technology", "Science"],
            "languages": ["en"],
            "summary_length": "medium",
        })
        report("PUT /preferences", r.status_code)

        r = await c.get("/api/v1/preferences", headers=headers)
        report("GET /preferences (after update)", r.status_code)

        r = await c.get("/api/v1/preferences")
        report("GET /preferences (no auth)", r.status_code, expected=[401, 403])

        # ---- Analytics ----
        print("\n=== ANALYTICS ===")
        r = await c.get("/api/v1/analytics/stats", headers=headers)
        report("GET /analytics/stats", r.status_code)

        r = await c.get("/api/v1/analytics/categories", headers=headers)
        report("GET /analytics/categories", r.status_code)

        r = await c.get("/api/v1/analytics/activity", headers=headers)
        report("GET /analytics/activity", r.status_code)

        r = await c.get("/api/v1/analytics/usage", headers=headers)
        report("GET /analytics/usage", r.status_code)

        r = await c.get("/api/v1/analytics/activity", headers=headers, params={"days": 30})
        report("GET /analytics/activity (30 days)", r.status_code)

        # ---- Admin ----
        print("\n=== ADMIN ===")
        r = await c.get("/api/v1/admin/health")
        report("GET /admin/health", r.status_code)

        r = await c.get("/api/v1/admin/stats", headers=headers)
        report("GET /admin/stats (no superuser)", r.status_code, expected=[403])

        r = await c.get("/api/v1/admin/users", headers=headers)
        report("GET /admin/users (no superuser)", r.status_code, expected=[403])

        # ---- Seed endpoint ----
        print("\n=== SEED ===")
        r = await c.post("/api/v1/news/seed/Technology", headers=headers)
        report("POST /news/seed/Technology", r.status_code, expected=range(200, 500))

        # ---- Error handling ----
        print("\n=== ERROR HANDLING ===")
        r = await c.get("/api/v1/nonexistent")
        report("GET /nonexistent (404)", r.status_code, expected=[404])

        r = await c.post("/api/v1/auth/register", json={"invalid": "data"})
        report("POST /auth/register (bad body)", r.status_code, expected=[422])

        r = await c.post("/api/v1/auth/login", json={"email": "bad@test.com", "password": "wrong"})
        report("POST /auth/login (bad creds)", r.status_code, expected=[401])

    print(f"\n{'='*50}")
    print(f"RESULTS: {results['pass']} passed, {results['fail']} failed")
    if results["errors"]:
        print(f"\nFAILURES:")
        for e in results["errors"]:
            print(e)
    return results["fail"] == 0


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
