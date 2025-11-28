import jwt from 'jsonwebtoken';
import type {Customer} from "../../shared/types.ts";
import {Types} from "mongoose";
import {ObjectId} from "mongodb";

/*
* Authenticates user's JWT
* Sets req.customer_id and req.email on success
* returns auth error to client on failure
* Currently only requires email for authentication, production version would use campus SSO.
 */
export function authenticateToken(req: any, res: any, next: Function) {
  // Check for token in cookie first (httpOnly), then fall back to Authorization header
  const token = req.cookies?.token || (req.headers['authorization']?.split(' ')[1]);

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key', (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.customer_id = decoded.customer_id;
    req.email = decoded.email;
    next();
  });
}

export function generateToken(id: ObjectId, email: string) {
    return jwt.sign(
        {
            customer_id: id,
            email: email
        },
        process.env.JWT_SECRET || 'dev-secret-key',
        { expiresIn: '1d' }
    );
}
