# booru-api

## Setup Instructions

1. Rename the example environment file to `.env`:
   ```bash
   mv .example.env .env
   ```

2. Start the application in detached mode:
   ```bash
   docker compose up -d
   ```

---

## Default `config/secrets.ts` File

```typescript
const e621Auth: Record<string, string> = {
  "User-Agent": "your-domain/1.0 (by your-username on e621)",
  Authorization: "Basic " + btoa("your-username:your-password"),
};

export { e621Auth };
```

> **Note**: Replace `your-username` and `your-password` with your e621 account credentials. Update the `User-Agent` string to include your domain and comply with e621's API guidelines.
