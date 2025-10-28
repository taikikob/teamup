// api/index.ts
import app from '../backend/dist/index.js';

// Export your Express app directly.
// Vercel treats this as the request handler automatically.
export default app;