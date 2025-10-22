## Quickstart

### Local (Docker)
```
docker compose up --build
```
- Web: http://localhost:5173
- API: http://localhost:8080/health
- Bot: uses `apps/bot/.env`

### Manual
- API: `cd apps/api/cmd/server && go run .`
- Web: `cd apps/web && npm i && npm run dev`
- Bot: `cd apps/bot && pip install -r requirements.txt && python -m src.main`
