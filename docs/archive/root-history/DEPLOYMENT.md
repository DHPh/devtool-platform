> **Historical document:** This file is retained for context only and may not match the current codebase. Use docs/INDEX.md for maintained guidance.

# 🚀 CI/CD Deployment Guide

## Overview
This project uses GitHub Actions for CI/CD with automatic deployment to Vercel.

## Workflow
- **Push to `main`** → Production deployment
- **Push to `develop`** → Preview deployment  
- **Pull Request** → Preview deployment with comment

## Setup Instructions

### 1. Vercel Setup
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Import your repository
3. Note down these values:
   - **Vercel Token**: Personal Access Token from Vercel dashboard
   - **Org ID**: Organization ID from project settings
   - **Project ID**: Project ID from project settings

### 2. GitHub Secrets Setup
Add these secrets to your GitHub repository:
1. Go to Repository → Settings → Secrets and variables → Actions
2. Add these secrets:
   ```
   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=your_org_id
   VERCEL_PROJECT_ID=your_project_id
   ```

### 3. Branch Protection (Optional)
Set up branch protection rules:
1. Go to Repository → Settings → Branches
2. Add rule for `main` branch:
   - Require status checks to pass
   - Require review from code owners
   - Require branches to be up to date

## How to Get Vercel IDs

### Get Vercel Token:
1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Create new token
3. Copy the token

### Get Org ID and Project ID:
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project (run in project directory)
vercel link

# Get project info
vercel project ls
```

## Deployment URLs
- **Production**: `https://devtool-platform.vercel.app`
- **Preview**: `https://devtool-platform-git-{branch}.vercel.app`

## Manual Deployment
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Environment Variables
Set environment variables in Vercel dashboard:
1. Go to Project → Settings → Environment Variables
2. Add variables for different environments

## Monitoring
- **Build Status**: GitHub Actions tab
- **Deployment Status**: Vercel dashboard
- **Performance**: Vercel Analytics (if enabled)
