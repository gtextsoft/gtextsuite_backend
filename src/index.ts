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
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
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


