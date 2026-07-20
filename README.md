# 🌍 Natours Backend API

Natours is a robust, fully-featured backend API for a tour booking web application, built with **Node.js**, **Express**, **MongoDB**, and **Mongoose**.

It features a secure JWT-based authentication system (including Google OAuth), Stripe payment integration via webhooks, automated email notifications, remote image upload/optimization using Multer, Sharp, and Cloudinary, an interactive reviews & rating system, a customized tour favorites list, and comprehensive security implementations against common vulnerabilities.

---

## ✨ Key Features

### 🔐 Authentication & Authorization

- **Double-Token JWT Auth**: Implements Access Tokens (15 min expiry) and Refresh Tokens (30 days expiry) for secure session management.
- **Google OAuth Login**: Integrated Google login/signup flows via Passport.js.
- **Email Confirmation**: Automated activation link sent to users upon signup.
- **Password Recovery**: Secure password reset flow using short-lived tokens sent via email.
- **Role-Based Access Control (RBAC)**: Protects endpoints based on roles: `user`, `guide`, `lead-guide`, and `admin`.

### 🗺️ Tours & Geospatial Queries

- **Advanced Querying**: Out-of-the-box filtering, sorting, field limiting, and pagination.
- **Geospatial API**: Queries to find tours within a specific radius (`/tour-within/...`) and calculate distances from a specific point (`/distances/...`).
- **Stats & Reporting**: Analytical aggregation pipelines to compute monthly tour schedules, and statistics on price, difficulty, and ratings.

### 💳 Bookings & Stripe Payments

- **Stripe Checkout Sessions**: Generates secure Stripe hosted payments links for tour booking.
- **Stripe Webhooks**: Listens for successful payment events from Stripe to automatically create and confirm bookings in the database.

### 💬 Reviews & Ratings

- **Dynamic Rating Calculations**: Automatically calculates average ratings and rating count when reviews are created, updated, or deleted.
- **Purchase Verification**: Ensures a user can only review tours that they have booked, paid for, and already completed.

### ❤️ Tour Favorites

- **Toggle Favorites**: Users can add or remove tours from their favorites list.
- **Favorites Fetching**: Direct endpoint to retrieve the user's populated favorites list.

### 🖼️ Image Upload & Processing

- **Multer & Sharp**: Handles multi-image uploads (tour covers, galleries, and user avatars) and resizes/compresses them on-the-fly.
- **Cloudinary Storage**: Directly uploads and manages optimized images on Cloudinary storage.

### 🛡️ Security & Performance

- **Helmet Headers**: Configures security-focused HTTP headers.
- **CORS Enabled**: Configured to work smoothly with frontend clients.
- **Rate Limiting**: Prevents brute-force attacks by limiting requests per IP on API routes.
- **Data Sanitization**: Safeguards database against NoSQL injections and Cross-Site Scripting (XSS).
- **HTTP Parameter Pollution (HPP)**: Prevents pollution on search query fields.
- **Gzip Compression**: Compresses responses to optimize network performance.

---

## 🛠️ Project Structure

```text
├── config/            # Google OAuth strategy configuration (Passport)
├── controllers/       # Route handler functions containing application logic (MVC)
├── dev-data/          # Mock data and utility script to import/delete data
├── middleware/        # Custom middlewares (JWT verification, role authorization)
├── models/            # Mongoose Schemas (Tours, Users, Reviews, Bookings, Favorites)
├── public/            # Static assets (default avatars, styles, basic views files)
├── routes/            # Express Router endpoint definitions
├── utils/             # Utility classes (APIFeatures, AppError, Email transport)
├── views/             # Pug templates for default server rendering & emails
├── app.js             # Main Express app initialization and middleware setup
├── server.js          # App entry point (connects to database & runs server)
├── config.env         # Local environment variables configuration (git-ignored)
└── package.json       # Dependencies and run scripts
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas cluster)

### Installation Steps

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Create a `config.env` file in the root of the `backend` directory and configure the variables below:
   ```env
   PORT=3000
   NODE_ENV=development
   
   # Database connection
   DATABASE=mongodb+srv://<username>:<password>@cluster.mongodb.net/dbname?retryWrites=true
   DATABASE_PASSWORD=your_mongodb_password

   # JWT & Security Keys (Make sure secrets are at least 32 characters long)
   ACCESS_TOKEN_SECRET_KEY=your_access_token_secret_key
   REFRESH_TOKEN_SECRET_KEY=your_refresh_token_secret_key
   EXCHANGE_TOKEN_SECRET=your_exchange_token_secret_key

   ACCESS_TOKEN_EXPIRES_IN=15m
   REFRESH_TOKEN_EXPIRES_IN=30d
   JWT_COOKIE_EXPIRES_IN=30
   PASSWORD_RESET_EXPIRES=10
   EMAIL_CONFIRMATION_EXPIRES=10

   # Development Email Service (e.g. Mailtrap)
   EMAIL_HOST=sandbox.smtp.mailtrap.io
   EMAIL_PORT=587
   EMAIL_USERNAME=your_mailtrap_username
   EMAIL_PASSWORD=your_mailtrap_password
   EMAIL_FROM=your_email@example.com

   # Production Email Service (e.g. SendGrid)
   SENDGRID_USERNAME=apikey
   SENDGRID_PASSWORD=your_sendgrid_password

   # Stripe Gateway Keys
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

   # Mapbox API
   MAPBOX_TOKEN=your_mapbox_token

   # Cloudinary Media Storage Config
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret

   # Client/Server URLs
   FRONTEND_URL=http://localhost:3000
   BACKEND_URL=http://localhost:3000

   # Google OAuth Credentials
   CLIENT_ID=your_google_client_id
   CLIENT_SECRET=your_google_client_secret
   ```

4. **Seed Database** with sample tours and reviews (Warning: this deletes existing collections first):
   - **To Import Dev Data**:
     ```bash
     node dev-data/data/import-dev-data.js --import
     ```
   - **To Delete Dev Data**:
     ```bash
     node dev-data/data/import-dev-data.js --delete
     ```

5. Run the application in Development Mode:

   ```bash
   npm run dev
   ```

6. Run the application in Production Mode:
   ```bash
   npm run prod
   ```

---

## 🔑 Default Admin Credentials

After seeding the database, a default **admin** account is available for testing:

| Field    | Value              |
| :------- | :----------------- |
| Email    | `admin@natours.io` |
| Password | `test1234`         |

> [!CAUTION]
> These are development/testing credentials only. **Never use them in a production environment.**

---

## 🔌 API Endpoints Documentation

### 🔑 Authentication & Users (`/api/v1/users`)

| Endpoint                           | Method             | Description                                 | Permission Required |
| :--------------------------------- | :----------------- | :------------------------------------------ | :------------------ |
| `/signup`                          | `POST`             | Registers a new user                        | Public              |
| `/login`                           | `POST`             | Logs in user and returns tokens             | Public              |
| `/logout`                          | `POST`             | Invalidates cookies and user session        | Public              |
| `/refreshToken`                    | `POST`             | Generates a new Access Token                | Public              |
| `/forgotPassword`                  | `POST`             | Sends password reset token to email         | Public              |
| `/resetPassword/:resetToken`       | `PATCH`            | Resets password using valid token           | Public              |
| `/confirmEmail/:confirmationToken` | `GET`              | Confirms user email & activates account     | Public              |
| `/auth/google`                     | `GET`              | Initiates Google OAuth2 login flow          | Public              |
| `/auth/google/callback`            | `GET`              | Google OAuth2 callback endpoint             | Public              |
| `/auth/exchange`                   | `POST`             | Exchanges temporary code for tokens         | Public              |
| `/me`                              | `GET`              | Fetches authenticated user's profile        | Authenticated User  |
| `/updateMe`                        | `PATCH`            | Updates user details (profile photo upload) | Authenticated User  |
| `/updateMyPassword`                | `PATCH`            | Updates current user's password             | Authenticated User  |
| `/deleteMe`                        | `DELETE`           | Deactivates user account (soft delete)      | Authenticated User  |
| `/stats`                           | `GET`              | Fetches general user statistics             | Admin               |
| `/`                                | `GET`              | Fetches list of all users                   | Admin               |
| `/:id`                             | `GET/PATCH/DELETE` | CRUD endpoints for a specific user          | Admin               |

### 🗺️ Tours (`/api/v1/tours`)

| Endpoint                                           | Method   | Description                                           | Permission Required      |
| :------------------------------------------------- | :------- | :---------------------------------------------------- | :----------------------- |
| `/`                                                | `GET`    | Retrieves all tours (with filters/sorting/paging)     | Public                   |
| `/slug/:slug`                                      | `GET`    | Retrieves a single tour by its slug                   | Public                   |
| `/top-5-cheap`                                     | `GET`    | Retrieves the top 5 cheapest and highly-rated tours   | Public                   |
| `/stats`                                           | `GET`    | Computes tour statistics                              | Public                   |
| `/tour-difficulty-stats`                           | `GET`    | Computes tour statistics grouped by difficulty        | Public                   |
| `/tour-within/:distance/center/:latlng/unit/:unit` | `GET`    | Finds tours within a specific distance radius         | Public                   |
| `/distances/:latlng/unit/:unit`                    | `GET`    | Computes distances to all tours from a location       | Public                   |
| `/monthly-plan/:year`                              | `GET`    | Gets monthly planning schedules for a given year      | Admin, Lead-Guide, Guide |
| `/`                                                | `POST`   | Creates a new tour (supports uploading tour images)   | Admin, Lead-Guide        |
| `/:id`                                             | `GET`    | Retrieves a single tour by ID                         | Public                   |
| `/:id`                                             | `PATCH`  | Updates a tour by ID (supports uploading tour images) | Admin, Lead-Guide        |
| `/:id`                                             | `DELETE` | Deletes a tour by ID                                  | Admin, Lead-Guide        |
| `/:id`                                             | `POST`   | Adds a new launch start date to a tour                | Admin, Lead-Guide        |

### 💬 Reviews (`/api/v1/reviews`)

_(Supports nesting: `/api/v1/tours/:tourId/reviews`)_
| Endpoint | Method | Description | Permission Required |
| :--- | :--- | :--- | :--- |
| `/` | `GET` | Retrieves all reviews | Authenticated User |
| `/my-reviews` | `GET` | Retrieves reviews written by current user | Authenticated User |
| `/stats` | `GET` | Retrieves reviews analytics and metrics | Admin |
| `/` | `POST` | Creates a new review (checks if user completed tour) | User |
| `/:id` | `GET` | Retrieves a single review by ID | Authenticated User |
| `/:id` | `PATCH` | Updates a review by ID | User, Admin |
| `/:id` | `DELETE` | Deletes a review by ID | User, Admin |

### 💳 Bookings (`/api/v1/bookings`)

_(Supports nesting: `/api/v1/users/:userId/bookings` or `/api/v1/tours/:tourId/bookings`)_
| Endpoint | Method | Description | Permission Required |
| :--- | :--- | :--- | :--- |
| `/checkout-session/:tourId/:dateId` | `GET` | Generates a Stripe Checkout Session for payment | Authenticated User |
| `/my-tours` | `GET` | Gets all tours booked by the current user | Authenticated User |
| `/booking-stats` | `GET` | Gets booking stats and revenue analytics | Admin |
| `/` | `GET` | Gets all bookings in the system | Admin |
| `/:id` | `GET/PATCH/DELETE` | CRUD endpoints for a specific booking ID | Admin |

### ❤️ Tour Favorites (`/api/v1/favorites`)

| Endpoint   | Method | Description                               | Permission Required |
| :--------- | :----- | :---------------------------------------- | :------------------ |
| `/`        | `GET`  | Retrieves list of user's favorite tours   | Authenticated User  |
| `/:tourId` | `POST` | Toggles tour favorite status (add/remove) | Authenticated User  |

---

## 🔒 Security Implementations

- **NoSQL Injection Protection**: Uses `express-mongo-sanitize` to filter query input and prevent malicious NoSQL queries.
- **XSS Protection**: Uses `xss-clean` to sanitize user inputs inside request body, parameters, and query strings.
- **Rate Limiting**: Employs `express-rate-limit` to restrict users to a maximum of 100 API requests per hour per IP.
- **CORS Protection**: Securely allows cross-origin resource sharing from the frontend domain.
- **Secure Password Hashing**: Utilizes strong `bcryptjs` hashing for storing safe password records.
- **Proxy Trust**: Configured with `app.set('trust proxy', 1)` to accurately obtain client IPs when behind proxies on cloud platforms like Render or Heroku.

---

## 📜 License

This project is licensed under the **ISC License**.
