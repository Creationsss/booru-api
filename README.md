# booru-api

## Setup Instructions

### Production Environment

1. Clone the repository:
   ```bash
   git clone https://git.creations.works/creations/booru-api
   cd booru-api
   ```

2. Copy the example environment file to `.env`:
   ```bash
   cp .env.example .env
   ```

3. Start the application in detached mode:
   ```bash
   docker compose up -d
   ```

---

### Development Environment

1. Clone the repository:
   ```bash
   git clone https://git.creations.works/creations/booru-api
   cd booru-api
   ```

2. Copy the example environment file to `.env`:
   ```bash
   cp .env.example .env
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

> **Note**
> To use the **e621 Booru route**, include the following **headers** in your request:
>
> ```http
> e621UserAgent: YourApplication/1.0 (by username on e621)
> e621Username: your-username
> e621ApiKey: your-apikey
> ```
> Replace `your-username` and `your-apikey` with your e621 account credentials. Update the `e621UserAgent` string to include your application name, version, and a contact method (e.g., your e621 username) to comply with e621's API guidelines.
>
>
> To use the **Gelbooru Booru route**, include these **headers** in your request:
>
> ```http
> gelbooruApiKey: your-apikey
> gelbooruUserId: your-user-id
> ```
> You can find these credentials in your [Gelbooru account settings](https://gelbooru.com/index.php?page=account&s=options). These are required for authenticated API requests and higher rate limits.
