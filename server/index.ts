import express from 'express';
import cors from 'cors';
import menu from "./routes/menu.ts";
import order from "./routes/order.ts";
import customer from "./routes/customer.ts";
import connectDB from './config/connection';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Alfred Ordering API is running' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            status: err.status || 500
        }
    });
});


// API routes
app.use('/api/menu', menu);
app.use('/api/order', order);
app.use('/api/customer', customer);


// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: { message: 'Route not found', status: 404 } });
});

await connectDB();
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/build'));

    const path = require('path');
    app.get('{*splat}', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    });
}

export default app;
