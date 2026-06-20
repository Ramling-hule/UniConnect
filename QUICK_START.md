# 🚀 Quick Start: Chatbot Now Indexes Website Posts & Images

## What Changed?
Your chatbot **no longer answers only from PDFs**. It now also answers based on:
- ✅ Posts from your website/social platform (with text)
- ✅ Text extracted from post images (using OCR)
- ✅ Comments on posts
- ✅ Website content from URLs (existing feature)

## 🎯 Setup (5 Minutes)

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Index Your Existing Posts
Run this to index all posts currently in your database:
```bash
curl -X POST http://localhost:5000/api/ingestion/posts/all \
  -H "Content-Type: application/json" \
  -d '{"limit": 100}'
```

✅ This will:
- Fetch all posts from your database
- Extract text from any post images (OCR)
- Include comments
- Index everything in ChromaDB

### Step 3: Test the Chatbot
Ask a question related to posts on your site - it should now answer based on that content!

---

## 📝 What Happened Under the Hood?

### Files Created
1. **`backend/src/services/postIngestionService.js`**
   - Extracts text from images using Tesseract.js (OCR)
   - Formats posts for vector indexing
   - Handles comments and metadata

2. **`backend/src/routes/ingestionRoutes.js`**
   - New API endpoints for post ingestion

### Files Modified
- **`backend/src/services/ingestionService.js`** - Added post ingestion functions
- **`backend/src/controllers/ingestionController.js`** - Added post ingestion handlers
- **`backend/src/routes/index.js`** - Registered new routes
- **`backend/package.json`** - Added `tesseract.js` for OCR

---

## 🔄 Ongoing Ingestion (Optional)

### Option A: Manual Updates
Whenever you want to index new posts:
```bash
curl -X POST http://localhost:5000/api/ingestion/posts/recent \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Option B: Automatic Hourly Updates (Recommended)
Add this to your `backend/src/app.js` or `server.js`:

```javascript
import cron from 'node-cron';
import { ingestRecentPosts } from './services/ingestionService.js';

// Install cron first: npm install node-cron

// Run every hour
cron.schedule('0 * * * *', async () => {
  try {
    console.log('📝 Indexing recent posts...');
    await ingestRecentPosts(new Date(Date.now() - 60 * 60 * 1000));
    console.log('✅ Recent posts indexed');
  } catch (error) {
    console.error('❌ Post ingestion failed:', error.message);
  }
});
```

Then run:
```bash
npm install node-cron
```

---

## 📊 Available API Endpoints

### Index All Posts
```
POST /api/ingestion/posts/all
Body: { "limit": 100, "skip": 0 }
```

### Index Recent Posts (Last 24h)
```
POST /api/ingestion/posts/recent
Body: { "fromDate": "2024-01-20T00:00:00Z" }  // Optional
```

### Index Posts from Specific User
```
POST /api/ingestion/posts/user/:userId
Body: {}
```

### Index Website URLs (Existing)
```
POST /api/ingestion/urls
Body: { "urls": ["https://example.com"], "maxDepth": 2 }
```

---

## ⚙️ Performance Notes

### OCR (Optical Character Recognition)
- **First time:** Downloads ~60-100MB language models (takes ~30 seconds)
- **Subsequent:** Models are cached, much faster
- **Per image:** 2-5 seconds for text extraction

### Best Practices
- **For large databases:** Process in batches of 50 posts at a time
- **Off-peak hours:** Schedule heavy indexing during low-traffic times
- **Monitor logs:** Look for `[OCR]` and `[POST INGESTION]` logs

### If Processing Too Slow
```javascript
// Process fewer posts per batch
await ingestAllPosts({ limit: 25, skip: 0 });
await ingestAllPosts({ limit: 25, skip: 25 });
// ... continue with skip += 25
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Dependencies missing | `cd backend && npm install` |
| Posts not indexing | Check if posts exist: `db.posts.count()` in MongoDB |
| OCR very slow | Reduce batch size or run during off-peak |
| "tesseract.js not found" | `npm install` again in backend folder |

---

## 📖 Detailed Documentation
See `CHATBOT_ENHANCEMENT.md` for complete documentation including:
- Detailed architecture explanation
- Advanced configuration options
- Complete API reference
- Future enhancement ideas

---

## 🎉 You're Done!
Your chatbot now has awareness of:
1. Website posts and their text
2. Images in posts (OCR-extracted text)
3. Comments and discussions
4. Website URLs
5. PDFs (original feature)

The chatbot will cite sources so users know where the answer came from! 🎯
