# quickzhiin API

A multi-tenant SaaS application API built with Node.js, Express, and TypeScript.

## Features

- Multi-tenant architecture
- Secure authentication and authorization
- Encryption utilities for sensitive data
- RESTful API endpoints
- TypeScript support

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

## Development

Start the development server:

```bash
npm run dev
# or
yarn dev
```

## Building for Production

Build the project:

```bash
npm run build
# or
yarn build
```

Start the production server:

```bash
npm start
# or
yarn start
```

## Testing

Run tests:

```bash
npm test
# or
yarn test
```

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/         # Data models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
└── index.ts        # Application entry point
```

## License

MIT

## Code Standard

📊 Summary Table
| Feature | **Service** | **Helper** | **Util** |
| ---------------- | ----------------- | -------------------- | --------------- |
| Contains logic? | ✅ Business logic | ✅ App-specific logic | ✅ Generic logic |
| Talks to DB/API? | ✅ Yes | ❌ No | ❌ No |
| Pure functions? | ❌ Usually not | ✅ Usually | ✅ Always |
| App-specific? | ✅ Yes | ✅ Yes | ❌ No |
| Example | `upsertProduct()` | `formatCurrency()` | `toSlug()` |

🧭 Rule of Thumb
Use services for “what the app does,”
helpers for small reusable logic within the app
utils for generic, context-free tools.
