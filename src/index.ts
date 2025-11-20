import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import { connectDB } from './db/connectDB';
import usersRoutes from './routes/users';
import propertiesRoutes from './routes/properties';
import bookingsRoutes from './routes/bookings';
import inquiriesRoutes from './routes/inquiries';

connectDB();

const PORT = process.env.PORT || 5000;

const app = express();

// CORS configuration - allow frontend origin and credentials
// Support both development and production frontend URLs
const allowedOrigins = [
  'http://localhost:3000', // Development frontend URL
  'https://gtextsuite.vercel.app', // Production frontend URL
  process.env.FRONTEND_URL, // Additional frontend URL from environment variable
].filter(Boolean) as string[]; // Remove undefined values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(cookieParser()); // Parse cookies from requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', async (_req, res) => {
    res.json({ message: 'Hello World' });
});

app.use('/api/users', usersRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/inquiries', inquiriesRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


