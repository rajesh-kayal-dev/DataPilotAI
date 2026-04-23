import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class GoogleAuthService {
  async verifyGoogleToken(token) {
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      return ticket.getPayload();
    } catch (error) {
      console.error('Google token verification error:', error);
      throw new Error('Invalid Google token');
    }
  }

  async findOrCreateUser(payload) {
    let user = await User.findOne({ email: payload.email });

    if (!user) {
      user = new User({
        name: payload.name,
        email: payload.email,
        password: '', // Not needed for Google auth
        isVerified: true,
        googleId: payload.sub,
      });
      await user.save();
    }

    return user;
  }

  generateJWT(user) {
    return jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
  }
}

export default new GoogleAuthService();