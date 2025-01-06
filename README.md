# booru-api

## Setup Instructions

### Production Environment

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd booru-api
   ```

2. Rename the example environment file to `.env`:
   ```bash
   mv .example.env .env
   ```

3. Start the application in detached mode:
   ```bash
   docker compose up -d
   ```

---

### Development Environment

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd booru-api
   ```

2. Rename the example environment file to `.env`:
   ```bash
   mv .example.env .env
   ```

3. Install dependencies using Bun:
   ```bash
   bun install
   ```

4. Start the development server:
   ```bash
   bun dev
   ```

---

> **Note** Replace `your-username` and `your-password` with your e621 account credentials. Update the `User-Agent` string to include your domain and comply with e621's API guidelines.
