import { Request, Response } from "express";
import Customer from '../models/Customer';
import { generateToken } from "../middleware/auth.ts";

export async function login(req: Request, res: Response) {
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
}

export async function logout(req: Request, res: Response) {
    res.clearCookie('token', { path: '/' });
    res.send({ message: 'Successfully logged out' });
}

export async function me(req: Request, res: Response) {
    // @ts-ignore customer_id set by authenticateToken middleware
    const customer = await Customer.findById(req.customer_id);
    res.json(customer);
}