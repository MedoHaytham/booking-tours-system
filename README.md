# Natours - Tour Booking Web Application

Natours is a full-featured tour booking web application built with Node.js, Express, MongoDB, Mongoose, and Pug templates. It includes user authentication, tour booking with Stripe, interactive maps via Mapbox, review systems, image upload & resizing, and email notifications.

## Features

- **Robust Backend API**: RESTful API built with Node.js and Express.
- **Database**: Mongoose schemas and models with MongoDB, implementing advanced query features (filtering, sorting, limiting fields, pagination).
- **Authentication & Authorization**:
  - User registration, login, logout, password reset, and password updates.
  - Role-based permissions (`user`, `guide`, `lead-guide`, `admin`) to secure specific endpoints and features.
  - Secure JWT authentication with HTTP-only cookies.
- **Tour Bookings**: Integrated Stripe payment gateway for purchasing tours.
- **Interactive Maps**: Tour locations displayed dynamically using Mapbox GL JS (with token loaded securely from server configuration).
- **Image Processing**:
  - Single/multiple image uploads using Multer.
  - Image resizing and optimization using Sharp.
- **Templating**: Server-side rendering using Pug templates for a clean and responsive frontend user experience.
- **Security & Optimization**:
  - Security headers with `helmet`.
  - Rate limiting to prevent brute-force attacks.
  - Data sanitization against NoSQL injection and XSS attacks.
  - Parameter pollution prevention with `hpp`.
- **Emails**: Automated welcome emails and password reset tokens sent via NodeMailer (configured for Mailtrap in development and SendGrid/SMTP support).

---

## Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local installation or MongoDB Atlas cluster)

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone <repository-url>
   cd booking-tours-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables. Create a `config.env` file in the root directory and populate it with your configuration details:
   ```env
   PORT=3000
   NODE_ENV=development
   DATABASE=mongodb+srv://<username>:<password>@cluster.mongodb.net/natours?retryWrites=true
   DATABASE_PASSWORD=your_db_password
   
   JWT_SECRET=your_jwt_secret_key_should_be_at_least_32_characters_long
   JWT_EXPIRES_IN=90d
   JWT_COOKIE_EXPIRES_IN=90

   EMAIL_HOST=sandbox.smtp.mailtrap.io
   EMAIL_PORT=2525
   EMAIL_USERNAME=your_mailtrap_username
   EMAIL_PASSWORD=your_mailtrap_password
   EMAIL_FROM=info@natours.io

   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

   MAPBOX_TOKEN=your_mapbox_public_token
   ```

4. Build frontend scripts (using Parcel):
   ```bash
   # For development auto-builds
   npm run watch:js
   ```

5. Run the application:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm run prod
   ```

The application will be accessible at `http://localhost:3000`.

---

## Project Structure

```text
├── controllers/       # Route handler functions (MVC Controllers)
├── dev-data/          # Mock data and scripts to import/delete database data
├── middleware/        # Custom Express middlewares (auth, roles, check tokens)
├── models/            # Mongoose Schemas (Tours, Users, Reviews, Bookings)
├── public/            # Static assets (CSS, images, bundled JS client files)
│   ├── js/            # Frontend JS files
│   └── css/           # CSS styles
├── routes/            # Express Router files (API & View routing)
├── utils/             # Helper classes (APIFeatures, AppError, Email helper)
├── views/             # Pug templates for server-side rendering
├── app.js             # Main Express application configuration
├── config.env         # Local environment variables config (ignored in Git)
├── server.js          # Entry point. Starts server and connects to MongoDB
└── package.json       # Node dependency list and scripts
```

---

## Development Scripts

- `npm run dev`: Runs the server with `nodemon` for auto-restarts on save.
- `npm run prod`: Runs the server in production mode.
- `npm run debug`: Runs the server with inspector support.
- `npm run watch:js`: Runs Parcel to compile and bundle frontend JS files dynamically when files change.
- `npm run build:js`: Standard build compilation for frontend bundle.

---

## License

This project is licensed under the ISC License.
