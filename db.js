const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon's SSL connection
  }
});

// Test the connection
pool.connect()
  .then(() => {
    console.log('Connected to Neon PostgreSQL database');
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });

// Helper functions for database operations
async function saveVideo(videoData) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Insert video
    const videoResult = await client.query(
      'INSERT INTO videos (tmdb_id, title, url, backdrop) VALUES ($1, $2, $3, $4) RETURNING id',
      [videoData.tmdbId, videoData.title, videoData.url, videoData.backdrop]
    );
    
    const videoId = videoResult.rows[0].id;
    
    // Insert subtitles
    if (videoData.tracks && videoData.tracks.length > 0) {
      for (const track of videoData.tracks) {
        await client.query(
          'INSERT INTO subtitles (video_id, label, file) VALUES ($1, $2, $3)',
          [videoId, track.label, track.file]
        );
      }
    }
    
    await client.query('COMMIT');
    return videoId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getVideoByTmdbId(tmdbId) {
  const client = await pool.connect();
  try {
    // Get video
    const videoResult = await client.query(
      'SELECT * FROM videos WHERE tmdb_id = $1',
      [tmdbId]
    );
    
    if (videoResult.rows.length === 0) {
      return null;
    }
    
    const video = videoResult.rows[0];
    
    // Get subtitles
    const subtitlesResult = await client.query(
      'SELECT label, file FROM subtitles WHERE video_id = $1',
      [video.id]
    );
    
    return {
      tmdbId: video.tmdb_id,
      title: video.title,
      url: video.url,
      backdrop: video.backdrop,
      tracks: subtitlesResult.rows
    };
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  saveVideo,
  getVideoByTmdbId
}; 