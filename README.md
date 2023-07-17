This is an expense form template built with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) and styled with TailwindCSS. The submitted data will be forwarded to a Google Sheet for bookkeeping purposes. This project also has OCR capability implemented to recognize text from photos eg. receipts. Users can also save the uploaded receipts to the Back End via multer. 

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### NextJS

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

