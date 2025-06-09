import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve the enhanced test page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-overlay-enhanced.html'));
});

// Proxy endpoint for Pinboard API calls
app.get('/api/pinboard/posts/get', async (req, res) => {
  try {
    const { url, auth_token } = req.query;
    
    if (!auth_token) {
      return res.status(400).json({ 
        error: 'Missing auth_token parameter' 
      });
    }
    
    if (!url) {
      return res.status(400).json({ 
        error: 'Missing url parameter' 
      });
    }
    
    // Make request to Pinboard API
    const pinboardUrl = `https://api.pinboard.in/v1/posts/get?url=${encodeURIComponent(url)}&auth_token=${auth_token}&format=json`;
    
    console.log(`Fetching from Pinboard: ${url}`);
    
    const response = await fetch(pinboardUrl);
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({
        error: `Pinboard API error: ${response.status} ${response.statusText}`,
        data
      });
    }
    
    // Transform the response to match our expected format
    if (data.posts && data.posts.length > 0) {
      const post = data.posts[0];
      const bookmark = {
        description: post.description || '',
        url: post.href || url,
        tags: post.tags ? post.tags.split(' ').filter(t => t.trim()) : [],
        shared: post.shared || 'yes',
        toread: post.toread || 'no',
        hash: post.hash || '',
        time: post.time || new Date().toISOString()
      };
      
      res.json({ 
        success: true, 
        bookmark,
        raw: data 
      });
    } else {
      res.json({ 
        success: false, 
        message: 'No bookmark found for this URL',
        raw: data 
      });
    }
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch from Pinboard API',
      details: error.message 
    });
  }
});

// Get all posts endpoint
app.get('/api/pinboard/posts/all', async (req, res) => {
  try {
    const { auth_token, tag, count = 100 } = req.query;
    
    if (!auth_token) {
      return res.status(400).json({ 
        error: 'Missing auth_token parameter' 
      });
    }
    
    let pinboardUrl = `https://api.pinboard.in/v1/posts/all?auth_token=${auth_token}&format=json&results=${count}`;
    
    if (tag) {
      pinboardUrl += `&tag=${encodeURIComponent(tag)}`;
    }
    
    console.log('Fetching all posts from Pinboard...');
    
    const response = await fetch(pinboardUrl);
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({
        error: `Pinboard API error: ${response.status} ${response.statusText}`,
        data
      });
    }
    
    // Transform the response
    const bookmarks = data.map(post => ({
      description: post.description || '',
      url: post.href || '',
      tags: post.tags ? post.tags.split(' ').filter(t => t.trim()) : [],
      shared: post.shared || 'yes',
      toread: post.toread || 'no',
      hash: post.hash || '',
      time: post.time || ''
    }));
    
    res.json({ 
      success: true, 
      bookmarks,
      count: bookmarks.length,
      raw: data 
    });
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch from Pinboard API',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Hoverboard development server running',
    endpoints: {
      '/api/pinboard/posts/get': 'Get bookmark by URL',
      '/api/pinboard/posts/all': 'Get all bookmarks',
      '/': 'Serve test page'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Hoverboard Development Server running on http://localhost:${PORT}`);
  console.log(`📋 Test page: http://localhost:${PORT}/`);
  console.log(`🔗 API health: http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('Available API endpoints:');
  console.log('  GET /api/pinboard/posts/get?url=<URL>&auth_token=<TOKEN>');
  console.log('  GET /api/pinboard/posts/all?auth_token=<TOKEN>&tag=<TAG>&count=<COUNT>');
  console.log('');
  console.log('To get your Pinboard API token: https://pinboard.in/settings/password');
}); 