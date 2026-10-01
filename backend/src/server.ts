import { app } from './app';
import { env } from './config/env';

const port = env.PORT || 5000;

const server = app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port} in ${env.NODE_ENV} mode`);
});

// Handle graceful shutdown
const shutdown = () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
