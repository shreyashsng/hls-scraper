# M3U8 Data Fetcher

A Node.js application that retrieves movie data from m3u8 URLs using TMDB IDs, integrating with a secure base URL configuration.

## Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)
- A valid TMDB API key
- Environment configuration for secure base URL

## Installation

1. Clone the repository or download the source code.
2. Navigate to the project directory and install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Create a `.env` file in the project root.
   - Add the following variables:
     ```
     PORT=3000
     BASE_URL=<your-secure-base-url>
     TMDB_API_KEY=<your-tmdb-api-key>
     ```
   - Replace `<your-secure-base-url>` with the protected base URL for the m3u8 scraper and `<your-tmdb-api-key>` with your TMDB API key.

## Running the Application

1. Start the server:
   ```bash
   node index.js
   ```
2. The server will run on the port specified in the `PORT` environment variable (defaults to 3000).

## API Usage

Send a GET request to retrieve movie data by TMDB ID:

```
GET /movie/:tmdbId
```

- **Base URL**: Configured via the `BASE(URL` environment variable (e.g., `http://localhost:3000` for local development).
- **Path Parameter**: Replace `:tmdbId` with a valid TMDB ID (e.g., `533535` for "Deadpool & Wolverine").

### Example Request

```bash
curl http://localhost:3000/movie/533535
```

### Response Format

The API returns a JSON object containing the following movie data:
- `movieUrl`: Streaming URL for the movie
- `title`: Movie title
- `posterPath`: URL to the movie poster
- `backdropPath`: URL to the movie backdrop
- `subtitles`: Array of available subtitle tracks
- `streamUrl`: Direct streaming URL

#### Example Response

```json
{
  "movieUrl": "https://example.com/stream/533535.m3u8",
  "title": "Deadpool & Wolverine",
  "posterPath": "https://image.tmdb.org/t/p/w500/abc123.jpg",
  "backdropPath": "https://image.tmdb.org/t/p/w1280/xyz789.jpg",
  "subtitles": [
    { "language": "English", "url": "https://example.com/subtitles/en.vtt" },
    { "language": "Spanish", "url": "https://example.com/subtitles/es.vtt" }
  ],
  "streamUrl": "https://example.com/stream/533535.m3u8"
}
```

## Error Handling

The API handles errors gracefully and returns appropriate HTTP status codes:
- **200 OK**: Successful response with movie data.
- **400 Bad Request**: Invalid TMDB ID or malformed request.
- **500 Internal Server Error**: Error fetching movie data, with a JSON response containing an error message:
  ```json
  {
    "error": "Failed to fetch movie data"
  }
  ```

## Security Considerations

- The base URL for the m3u8 scraper is stored in the `.env` file to prevent abuse and ensure secure access.
- Ensure the TMDB API key is kept confidential and not exposed in client-side code or public repositories.

## Notes

- Verify that the TMDB ID is valid before making requests.
- The application assumes a stable internet connection for fetching data from the configured base URL and TMDB API.
