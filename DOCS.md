# Booru API Documentation

A unified API for accessing multiple booru image boards.

## Base URL
```
http://localhost:6600
```

## Supported Boorus

| Booru | Aliases | Status |
|-------|---------|--------|
| rule34.xxx | `rule34`, `r34`, `rule34xxx` | ✅ Enabled |
| safebooru.org | `safebooru`, `sb`, `s34` | ✅ Enabled |
| tbib.org | `tbib`, `tb`, `tbiborg` | ✅ Enabled |
| hypnohub.net | `hypnohub`, `hh`, `hypnohubnet` | ✅ Enabled |
| xbooru.com | `xbooru`, `xb`, `xboorucom` | ✅ Enabled |
| e621.net | `e621`, `e6`, `e621net` | ✅ Enabled |
| gelbooru.com | `gelbooru`, `gb`, `gelboorucom` | ✅ Enabled |
| realbooru.com | `realbooru`, `rb`, `real34`, `realb` | ❌ Disabled |

## Authentication

### E621
Required headers for e621 requests:
```http
e621UserAgent: YourApplication/1.0 (by username on e621)
e621Username: your-username
e621ApiKey: your-apikey
```

### Gelbooru
Required headers for Gelbooru requests:
```http
gelbooruApiKey: your-apikey
gelbooruUserId: your-user-id
```

## Endpoints

### 1. Search Posts
Search for posts with specific tags.

```http
POST /{booru}/search
Content-Type: application/json
```

**Request Body:**
```json
{
  "tags": ["tag1", "tag2"],
  "excludeTags": ["unwanted_tag"],
  "page": 0,
  "results": 10,
  "tag_format": "formatted"
}
```

**Parameters:**
- `tags` (string|array): Tags to search for
- `excludeTags` (string|array): Tags to exclude
- `page` (number): Page number (default: 0)
- `results` (number): Number of results (default: 5)
- `tag_format` (string): Format of tags in response (`"formatted"` or `"unformatted"`)

**Example:**
```bash
curl -X POST "http://localhost:6600/rule34/search" \
  -H "Content-Type: application/json" \
  -d '{
    "tags": ["cat", "cute"],
    "results": 5
  }'
```

### 2. Random Posts
Get random posts with optional tag filtering.

```http
POST /{booru}/random
Content-Type: application/json
```

**Request Body:**
```json
{
  "tags": ["tag1", "tag2"],
  "excludeTags": ["unwanted_tag"],
  "results": 5,
  "tag_format": "formatted"
}
```

**Example:**
```bash
curl -X POST "http://localhost:6600/safebooru/random" \
  -H "Content-Type: application/json" \
  -d '{
    "tags": ["anime"],
    "results": 3
  }'
```

### 3. Get Post by ID
Retrieve a specific post by its ID.

```http
GET /{booru}/id/{id}?tag_format=formatted
```

**Parameters:**
- `id` (string): Post ID
- `tag_format` (query): Format of tags in response

**Example:**
```bash
curl "http://localhost:6600/rule34/id/123456?tag_format=formatted"
```

### 4. Tag Autocomplete
Get tag suggestions for autocomplete.

```http
GET /{booru}/autocomplete/{tag}
```

**Parameters:**
- `tag` (string): Partial tag name (minimum 3 characters for e621)

**Example:**
```bash
curl "http://localhost:6600/safebooru/autocomplete/anim"
```

### 5. API Info
Get basic API information.

```http
GET /
```

**Example:**
```bash
curl "http://localhost:6600/"
```

## Response Format

### Success Response
```json
{
  "success": true,
  "code": 200,
  "posts": [
    {
      "id": 123456,
      "file_url": "https://example.com/image.jpg",
      "post_url": "https://example.com/post/123456",
      "tags": "tag1 tag2 tag3",
      "directory": 1234,
      "hash": "abcdef123456"
    }
  ]
}
```

### Error Response
```json
{
  "success": false,
  "code": 400,
  "error": "Missing booru parameter"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Missing or invalid parameters |
| 401 | Unauthorized - Missing authentication headers |
| 403 | Forbidden - Booru is disabled |
| 404 | Not Found - No results found or booru not found |
| 405 | Method Not Allowed - Wrong HTTP method |
| 406 | Not Acceptable - Wrong content type |
| 500 | Internal Server Error |
| 501 | Not Implemented - Feature not supported |

## Usage Examples

### Search for anime posts on Safebooru
```bash
curl -X POST "http://localhost:6600/safebooru/search" \
  -H "Content-Type: application/json" \
  -d '{
    "tags": ["anime", "girl"],
    "results": 10,
    "page": 0
  }'
```

### Get random posts from Rule34
```bash
curl -X POST "http://localhost:6600/rule34/random" \
  -H "Content-Type: application/json" \
  -d '{
    "tags": ["pokemon"],
    "excludeTags": ["gore"],
    "results": 5
  }'
```

### Search E621 with authentication
```bash
curl -X POST "http://localhost:6600/e621/search" \
  -H "Content-Type: application/json" \
  -H "e621UserAgent: MyApp/1.0 (by myusername on e621)" \
  -H "e621Username: myusername" \
  -H "e621ApiKey: myapikey" \
  -d '{
    "tags": ["canine"],
    "results": 5
  }'
```

### Get tag suggestions
```bash
curl "http://localhost:6600/gelbooru/autocomplete/anim" \
  -H "gelbooruApiKey: your-api-key" \
  -H "gelbooruUserId: your-user-id"
```

## Rate Limiting

This API respects the rate limits of the underlying booru services. Please be mindful of your request frequency to avoid being blocked by the source APIs.

## Notes

- All POST requests require `Content-Type: application/json` header
- Some boorus may have different response formats
- E621 requires authentication for all requests
- Gelbooru requires authentication for better rate limits
- Tag formats may vary between boorus
- The `tag_format` parameter allows you to choose between formatted strings or raw objects
