# Airbnb Homes — Express backend + Cloudinary

This backend preserves the original Airbnb Homes features and provides JSON APIs for the supplied React frontend. New property images are uploaded to Cloudinary; MongoDB stores each image URL and its Cloudinary public ID.

## Features

- Signup/login/logout using the existing MongoDB user model and Express sessions
- User and host roles
- List and fetch homes
- Host-only create, edit, and delete property endpoints
- Favourite add/remove/list endpoints
- Cloudinary image upload, replacement, and deletion
- Existing EJS routes retained for compatibility; EJS host uploads also use Cloudinary
- Existing local `/uploads` files remain served for old records

## Setup

1. Install Node.js LTS.
2. Copy `.env.example` to `.env`.
3. Fill in `MONGO_URI`, `SESSION_SECRET`, and the three Cloudinary values. Do not commit `.env`.
4. In this folder run:

   ```bash
   npm install
   npm start
   ```

