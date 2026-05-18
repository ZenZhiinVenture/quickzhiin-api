// Load environment variables first
import './services/config/env';

import app from './app'; // Import the configured Express app
import logger from './utils/logger';

const PORT = process.env.PORT || 3001; // Default to 3001 if PORT is not set

// Start the server
const server = app.listen(PORT, () => {
  logger.info(`Server is running on port :${PORT}`);
});

// Graceful Shutdown Handling
const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

signals.forEach(signal => {
  process.on(signal, () => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0); // Exit cleanly
    });

    // Force shutdown after a timeout if graceful shutdown fails
    setTimeout(() => {
      logger.error('Could not close connections in time, forcing shutdown.');
      process.exit(1);
    }, 10000); // 10 seconds timeout
  });
});
