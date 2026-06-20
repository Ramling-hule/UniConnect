# 🧪 Testing Guide - Post Ingestion & Chatbot

This guide shows you how to test the new post ingestion and chatbot functionality.

## Prerequisites
- Backend running on `http://localhost:5000`
- MongoDB with some posts in the database
- ChromaDB running
- Dependencies installed (`npm install` in backend)

---

## 1. Verify Installation

### Option A: Bash (Linux/Mac)
```bash
bash verify-setup.sh
```

### Option B: PowerShell (Windows)
```powershell
powershell -ExecutionPolicy Bypass -File verify-setup.ps1
```

Expected output: ✅ All checks passed!

---

## 2. Test Post Ingestion

### Test A: Ingest All Posts
```bash
curl -X POST http://localhost:5000/api/ingestion/posts/all \
  -H "Content-Type: application/json" \
  -d '{"limit": 10, "skip": 0, "chunkSize": 900, "chunkOverlap": 200}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully ingested 10 posts",
  "type": "posts",
  "postsProcessed": 10,
  "documentChunks": 45,
  "indexResult": {
    "ids": [...],
    "added": 45,
    "successfully_added": 45
  }
}
```

**What happens:**
- Fetches 10 posts from database
- For each post with an image, runs OCR
- Creates semantic chunks
- Indexes in ChromaDB
- ⏱️ May take 2-10 minutes depending on images

---

### Test B: Ingest Recent Posts (Last 24 Hours)
```bash
curl -X POST http://localhost:5000/api/ingestion/posts/recent \
  -H "Content-Type: application/json" \
  -d '{"chunkSize": 900}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully ingested 3 recent posts",
  "type": "recent_posts",
  "fromDate": "2024-01-19T14:30:00.000Z",
  "postsProcessed": 3,
  "documentChunks": 15,
  "indexResult": { ... }
}
```

---

### Test C: Ingest Posts from Specific User
Replace `USER_ID` with an actual user ID from your database:

```bash
curl -X POST http://localhost:5000/api/ingestion/posts/user/USER_ID \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully ingested 5 posts for user USER_ID",
  "type": "user_posts",
  "userId": "USER_ID",
  "postsProcessed": 5,
  "documentChunks": 22,
  "indexResult": { ... }
}
```

---

## 3. Test Chatbot Queries

After ingesting posts, test if the chatbot can answer questions based on post content.

### Test A: Basic Query
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are people talking about lately?"}'
```

**Expected Response:**
```json
{
  "success": true,
  "answer": "Based on recent posts, people have been discussing...",
  "sources": [
    {
      "source": "post/507f1f77bcf86cd799439011",
      "title": "Post by John Doe",
      "snippet": "Discussion about recent events..."
    },
    {
      "source": "post/507f1f77bcf86cd799439012",
      "title": "Post by Jane Smith",
      "snippet": "Thoughts on the topic..."
    }
  ]
}
```

### Test B: Query About Specific User's Posts
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What has John been posting about?"}'
```

**Expected Response:**
```json
{
  "success": true,
  "answer": "John has been posting about...",
  "sources": [
    {
      "source": "post/507f1f77bcf86cd799439011",
      "title": "Post by John Doe",
      "snippet": "..."
    }
  ]
}
```

### Test C: Query About Image Content
If you have posts with images:

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What does the latest image post say?"}'
```

**Expected Response:**
```json
{
  "success": true,
  "answer": "The image contains text about...",
  "sources": [
    {
      "source": "post/507f1f77bcf86cd799439011",
      "title": "Post by John Doe",
      "snippet": "IMAGE TEXT: The extracted text from the image..."
    }
  ]
}
```

---

## 4. Error Testing

### Test A: Missing Required Fields
```bash
curl -X POST http://localhost:5000/api/ingestion/posts/all \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: 200 OK with default values

### Test B: Invalid User ID
```bash
curl -X POST http://localhost:5000/api/ingestion/posts/user/invalid-id \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: 200 OK with `postsProcessed: 0`

### Test C: No Posts in Database
If database is empty, ingestion should return:
```json
{
  "success": true,
  "postsProcessed": 0,
  "documentChunks": 0,
  "indexResult": null
}
```

---

## 5. Frontend Testing (React)

### Create Test Component
Create a file: `frontend/src/components/TestIngestion.js`

```javascript
import React, { useState } from 'react';
import {
  ingestAllPostsAPI,
  ingestRecentPostsAPI,
  ingestUserPostsAPI,
} from '../utils/ingestionAPI';

export default function TestIngestion() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleIngestAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ingestAllPostsAPI();
      setResult(result);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleIngestRecent = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ingestRecentPostsAPI();
      setResult(result);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Chatbot Ingestion Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={handleIngestAll}
          disabled={loading}
          style={{ padding: '10px 20px', marginRight: '10px' }}
        >
          {loading ? 'Processing...' : 'Ingest All Posts'}
        </button>
        
        <button 
          onClick={handleIngestRecent}
          disabled={loading}
          style={{ padding: '10px 20px' }}
        >
          {loading ? 'Processing...' : 'Ingest Recent Posts'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          Error: {error}
        </div>
      )}

      {result && (
        <div style={{ 
          backgroundColor: '#f0f0f0', 
          padding: '15px', 
          borderRadius: '5px',
          fontFamily: 'monospace'
        }}>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

### Use in Your App
```javascript
import TestIngestion from './components/TestIngestion';

// In your app
<TestIngestion />
```

---

## 6. Performance Testing

### Measure Ingestion Time
```javascript
// In Node.js/backend
import { ingestAllPosts } from './services/ingestionService.js';

const start = Date.now();
const result = await ingestAllPosts({ limit: 50 });
const duration = Date.now() - start;

console.log(`Ingested ${result.postsProcessed} posts in ${duration}ms`);
console.log(`Average: ${(duration / result.postsProcessed).toFixed(2)}ms per post`);
```

### Test with Various Batch Sizes
```javascript
const sizes = [10, 25, 50, 100];

for (const size of sizes) {
  const start = Date.now();
  const result = await ingestAllPosts({ limit: size });
  const duration = Date.now() - start;
  console.log(`Batch ${size}: ${duration}ms (${result.documentChunks} chunks)`);
}
```

---

## 7. Monitoring During Ingestion

### Watch Console Logs
You should see logs like:
```
[POST INGESTION] Fetching posts from database...
[POST INGESTION] Found 50 posts
[OCR] Extracting text from image: https://cloudinary.com/...
[OCR] Progress: 50%
[OCR] Successfully extracted 245 characters from image
[INGESTION] Indexing 150 document chunks from 50 posts...
✅ Post ingestion completed successfully!
```

### Check ChromaDB
If you have ChromaDB UI running (usually http://localhost:8000):
1. Check collection size increased
2. Verify document count matches

---

## 8. Database Verification

### Check Posts in MongoDB
```javascript
// In MongoDB shell
use your_db_name

// Count total posts
db.posts.countDocuments()

// Find recent posts
db.posts.find().sort({ createdAt: -1 }).limit(5)

// Find posts with images
db.posts.find({ image: { $exists: true, $ne: null } }).count()

// Find posts with comments
db.posts.find({ comments: { $exists: true, $not: { $size: 0 } } }).count()
```

---

## 9. End-to-End Test Checklist

- [ ] Backend dependencies installed (`npm install`)
- [ ] `tesseract.js` in package.json
- [ ] All new service files created
- [ ] All new route files created
- [ ] Routes registered in index.js
- [ ] Ingestion endpoints accessible
- [ ] Posts successfully indexed (check logs for [INGESTION])
- [ ] No OCR errors (check logs for [OCR])
- [ ] Chatbot returns post sources in responses
- [ ] Frontend API utilities work

---

## 10. Troubleshooting Test Failures

| Issue | Solution |
|-------|----------|
| 404 on ingestion endpoints | Restart server, check routes registered |
| No posts indexed | Check MongoDB has posts, verify queries work |
| OCR errors | Check internet (first run downloads models), check image URLs |
| Chatbot returns no sources | Index posts first, check ChromaDB running |
| Tesseract not found | `cd backend && npm install` |
| Memory issues | Reduce batch size from 100 to 25 |

---

## Quick Test Commands

```bash
# 1. Start fresh
cd backend && npm install

# 2. Index posts
curl -X POST http://localhost:5000/api/ingestion/posts/all \
  -H "Content-Type: application/json" \
  -d '{"limit": 5}'

# 3. Wait 30 seconds for indexing

# 4. Test chatbot
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are people posting about?"}'

# 5. Check response includes post sources
```

---

## Success Indicators

✅ Ingestion works when you see:
- `[POST INGESTION] Found X posts`
- `[INGESTION] Indexing X document chunks`
- `Post ingestion completed successfully!`

✅ Chatbot works when:
- Response includes `"sources"` array
- Sources have `"source": "post/..."`
- Answer is based on post content
- Contains `"snippet"` from posts

✅ OCR works when:
- Response includes post image text
- `[OCR] Successfully extracted X characters`
- Image text appears in answer

---

That's it! You now have a complete testing guide for the chatbot enhancement. 🎉
