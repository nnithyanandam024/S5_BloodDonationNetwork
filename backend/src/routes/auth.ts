import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { userRepository } from '../repositories';
import { requireAuth, JWT_SECRET, AuthPayload } from '../middleware/auth';
import { DonorProfile, HospitalProfile } from '../types';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, phone, role, bloodGroup, dateOfBirth, location, hospitalName, licenseNumber } = req.body;

    if (!email || !password || !name || !role) {
      res.status(400).json({ error: 'Missing required registration fields' });
      return;
    }

    const existing = userRepository.findByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 8);
    const userId = `${role.toLowerCase()}-${uuidv4().substring(0, 8)}`;
    const createdAt = new Date().toISOString();

    let newUser: DonorProfile | HospitalProfile;

    if (role === 'DONOR') {
      newUser = {
        id: userId,
        email: email.toLowerCase(),
        passwordHash,
        name,
        phone: phone || '',
        role: 'DONOR',
        bloodGroup: bloodGroup || 'O+',
        dateOfBirth: dateOfBirth || '2000-01-01',
        location: location || { latitude: 12.9716, longitude: 77.5946, city: 'Bengaluru' },
        isAvailable: true,
        donationCount: 0,
        createdAt,
      };
    } else if (role === 'HOSPITAL') {
      newUser = {
        id: userId,
        email: email.toLowerCase(),
        passwordHash,
        name,
        phone: phone || '',
        role: 'HOSPITAL',
        hospitalName: hospitalName || name,
        licenseNumber: licenseNumber || 'LIC-PENDING',
        location: location || { latitude: 12.9750, longitude: 77.5990, city: 'Bengaluru' },
        createdAt,
      };
    } else {
      res.status(400).json({ error: 'Unsupported registration role for mobile flow' });
      return;
    }

    userRepository.save(newUser);

    const payload: AuthPayload = { userId: newUser.id, email: newUser.email, role: newUser.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json({ user: safeUser, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = userRepository.findByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const payload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, (req: Request, res: Response): void => {
  const user = userRepository.findById(req.user!.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});
