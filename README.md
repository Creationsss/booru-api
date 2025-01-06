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

> **Note**
> To use the e621 API, you must update the following environment variables in your `.env` file:
>
> ```env
> # REQUIRED if you want to use the e621 API
> E621_USER_AGENT=YourApplicationName/1.0 (by username on e621)
> E621_USERNAME=your-username
> E621_API_KEY=your-apikey
> ```
>
> Replace `your-username` and `your-apikey` with your e621 account credentials. Update the `User-Agent` string to include your application name, version, and a contact method (e.g., your e621 username) to comply with e621's API guidelines.
