import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { connectDB } from './db/connectDB';
import usersRoutes from './routes/users';

connectDB();

const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
    res.json({ message: 'Hello World' });
});

app.use('/api/users', usersRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


