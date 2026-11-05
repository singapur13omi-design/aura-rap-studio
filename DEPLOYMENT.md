# AURA RAP STUDIO – DEPLOYMENT GUIDE

## 1. Local Production Run
```bash
# 1. Build the Next.js bundle
npm run build

# 2. Run the production server
npm start
```

---

## 2. Deploying to Vercel
1. Push repository to GitHub or GitLab.
2. Import project in Vercel.
3. Configure Environment Variables:
   - `DATABASE_URL`: Connection string to your PostgreSQL database (e.g. Neon, Supabase, AWS RDS).
   - `NEXT_PUBLIC_APP_URL`: Your deployment domain URL.
4. Deploy.

---

## 3. PostgreSQL / Neon Production Database Setup
1. In `prisma/schema.prisma`, update provider to `postgresql`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `.env` with your Neon/Postgres connection string:
   ```env
   DATABASE_URL="postgresql://user:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
3. Run migrations:
   ```bash
   npx prisma db push
   ```

---

## 4. Docker Deployment
Create a `Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```
