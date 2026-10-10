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

The API starts on `http://localhost:3000` after MongoDB connects.

## React frontend

Extract your separate React frontend project alongside this backend or into the backend's `frontend` directory. Its Vite proxy should forward `/api` and `/uploads` to `http://localhost:3000`. From the frontend directory run:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

The frontend's Axios client uses `baseURL: '/api'`, so API paths such as `/homes` resolve to `/api/homes`.

## API endpoints used by the supplied React frontend

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/auth/me` | Current session user |
| POST | `/api/auth/signup` | Register user or host |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/homes` | List homes |
| GET | `/api/homes/:id` | Home details |
| GET | `/api/favourites` | Current user's favourites |
| POST | `/api/favourites/:id` | Toggle favourite |
| DELETE | `/api/favourites/:id` | Remove favourite |
| GET | `/api/host/homes` | List current host's homes |
| POST | `/api/host/homes` | Create a home; multipart field `photo` |
| PUT | `/api/host/homes/:id` | Update a home; optional multipart field `photo` |
| DELETE | `/api/host/homes/:id` | Delete a home |

## Image storage

- React uploads the file using `FormData` with the field name `photo`.
- Express uses `multer-storage-cloudinary` to upload to the Cloudinary `airbnb-homes` folder.
- MongoDB stores `photo` as the HTTPS image URL and `photoPublicId` as the Cloudinary public ID.
- Replacing or deleting a listing attempts to delete the previous Cloudinary image.
- Old database records with local paths such as `uploads/example.png` remain supported locally. Migrate those images to Cloudinary before deploying the app to separate hosting.

## Deployment notes

- Set `NODE_ENV=production`, `MONGO_URI`, `SESSION_SECRET`, Cloudinary variables, and `FRONTEND_URL` in your hosting provider's environment settings.
- `FRONTEND_URL` may contain comma-separated allowed frontend origins.
- For cross-site production cookies, HTTPS is required because the session cookie uses `SameSite=None; Secure`.
- Never expose `CLOUDINARY_API_SECRET`, `SESSION_SECRET`, or the MongoDB credentials in React or Git.
- If the frontend is hosted separately, make sure its Axios client has `withCredentials: true` and the backend `FRONTEND_URL` matches the exact frontend origin.

## Notes

This archive does not include `.env` secrets. Configure your own values before starting the server.

## One small React image URL fix

The provided React archive currently prepends `/` to every `home.photo` value unless it already starts with `/`. Cloudinary URLs start with `https://`, so that logic turns them into invalid paths. In `frontend/src/components/HomeCard.jsx` and the `HomeDetails` component in `frontend/src/pages/HomePages.jsx`, use:

```js
const image = home.photo
  ? (/^https?:\/\//i.test(home.photo) || home.photo.startsWith("/")
      ? home.photo
      : `/${home.photo}`)
  : "";
```

This preserves Cloudinary URLs and continues to support legacy local `/uploads/...` paths.
## Cloudinary dependency note

This backend uses `cloudinary` v2 directly with Multer memory storage and `upload_stream`. It intentionally does not use `multer-storage-cloudinary`, whose peer dependency requires Cloudinary v1 and causes npm ERESOLVE conflicts. Existing routes can continue using `upload.single("photo")`.
