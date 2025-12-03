import express from 'express';
import jwt from 'jsonwebtoken';
import Customer from '../models/Customer';
import {authenticateToken, generateToken} from "../middleware/auth.ts";

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email required' });
        }

        // Find or create customer
        let customer = await Customer.findOne({ email });
        if (!customer) {
            // Auto-create customer on first login
            customer = await Customer.create({
                fname: email.split('@')[0], // Use email prefix as name
                lname: 'User',
                email: email
            });
        }

        const token = generateToken(customer._id, customer.email);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({ token, customer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Authentication Error' });
    }
});

router.post('/logout', async (req, res) => {
    res.clearCookie('token', { path: '/' });
    res.send({ message: 'Successfully logged out' });
})

router.get('/me', authenticateToken, async (req, res) => {
    // @ts-ignore customer_id set by authenticateToken middleware
    const customer = await Customer.findById(req.customer_id);
    res.json(customer);
});

export default router;
