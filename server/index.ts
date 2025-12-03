import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import menu from "./routes/menu.ts";
import order from "./routes/order.ts";
import customer from "./routes/customer.ts";
import connectDB from './config/connection';
import auth from "./routes/auth.ts";
import path from 'path'

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? true  // Same-origin only in production
        : (process.env.CORS_ORIGIN || 'http://localhost:5173'),
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({status: 'ok', message: 'Alfred Ordering API is running'});
});

// API routes
app.use('/api/auth', auth);
app.use('/api/menu', menu);
app.use('/api/order', order);
app.use('/api/customer', customer);

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist/client')));
}

if (process.env.NODE_ENV === 'production') {
    app.get('{*splat}', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/client', 'index.html'));
    });
}

// 404 handler for API routes only
app.use('/api/{*splat}', (req, res) => {
    res.status(404).json({error: {message: 'Route not found', status: 404}});
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: {
            message: 'Internal Server Error',
            status: 500
        }
    });
});

await connectDB();
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    if (process.env.NODE_ENV === 'production') {
        console.log(`Frontend served from: ${path.join(__dirname, '../dist/client')}`);
    }
});

export default app;
