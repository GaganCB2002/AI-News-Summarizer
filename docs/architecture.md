# Architecture Overview

## High-Level Architecture

The AI News Summarizer follows a modern, decoupled client-server architecture:

1. **Frontend (Client)**: A Single Page Application (SPA) built with React and Vite. It handles all UI rendering, routing, and state management. It communicates with the backend via REST API.
2. **Backend (Server)**: A FastAPI application serving as the API Gateway and business logic layer. It handles authentication, data validation, database interactions, and integrations with external News and LLM APIs.
3. **Database**: A relational database (PostgreSQL for production, SQLite for local dev) that stores user accounts, preferences, cached news articles, and generated summaries.

## Backend Pattern
The backend adheres to Clean Architecture and Repository patterns:
- **Routers (`app/api/endpoints`)**: Handle HTTP requests/responses and route them to services.
- **Services (`app/services`)**: Contain the core business logic (e.g., orchestrating news fetching and summarization).
- **Repositories (`app/repositories`)**: Abstract database operations (CRUD).
- **Models (`app/models`)**: SQLAlchemy ORM models representing database tables.
- **Schemas (`app/schemas`)**: Pydantic models for request validation and response serialization.

## Deployment Architecture
Using Docker Compose, the application is deployed as multi-container setup:
- `frontend`: Nginx serving the static React build.
- `backend`: Uvicorn running the FastAPI application.
- `db`: PostgreSQL database instance.
