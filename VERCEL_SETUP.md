# Vercel Deployment & Troubleshooting Guide

## 🚨 Root Cause of `Digest: 3372074012` Application Error

When deploying to Vercel, `.env` is ignored by `.gitignore` (which is essential for security so passwords aren't leaked to public repositories).

Because `.env` was not committed, Vercel attempts to load pages without a `DATABASE_URL` or `JWT_SECRET`, causing Prisma to throw a **Server-Side Exception (`Digest: 3372074012`)**.

---

## 🛠️ Step-by-Step Fix (2 Minutes)

### Step 1: Add Environment Variables in Vercel

1. Go to your **[Vercel Dashboard](https://vercel.com/dashboard)**.
2. Select your project **`ABS-Finance`** (or `abs-finance`).
3. Click on **Settings** → **Environment Variables**.
4. Add the following two variables:

#### Variable 1:
- **Key**: `DATABASE_URL`
- **Value**:
  ```text
  mysql://3fWwtUGfuz4DWdC.root:0EchrJYf1CuupquC@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/abs_finance?sslaccept=strict
  ```
- **Target**: Select `Production`, `Preview`, and `Development`.

#### Variable 2:
- **Key**: `JWT_SECRET`
- **Value**:
  ```text
  abs_finance_super_secret_jwt_key_2026_finance_aios
  ```
- **Target**: Select `Production`, `Preview`, and `Development`.

---

### Step 2: Trigger a Redeploy

1. Go to the **Deployments** tab in Vercel.
2. Find the latest deployment, click the **three dots (...)** on the right, and select **Redeploy**.
3. Check the box for **"Redeploy with existing build cache"** (or uncheck if you want a fresh build).
4. Click **Redeploy**.

---

## ⚡ What We Updated in Code

1. Added `vercel.json` to ensure `prisma generate && next build` runs automatically on Vercel.
2. Updated `prisma/schema.prisma` with `binaryTargets = ["native", "rhel-openssl-1.0.x", "rhel-openssl-3.0.x"]` so Prisma Client engine binaries compile for Vercel AWS Lambda Linux instances.
