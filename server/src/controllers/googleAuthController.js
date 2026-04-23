import googleAuthService from '../services/googleAuthService.js';

class GoogleAuthController {
  async handleGoogleAuth(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Google token is required' });
      }

      // Verify Google token and get payload
      const payload = await googleAuthService.verifyGoogleToken(token);

      // Find or create user
      const user = await googleAuthService.findOrCreateUser(payload);

      // Generate JWT token
      const jwtToken = googleAuthService.generateJWT(user);

      res.json({
        token: jwtToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Google auth error:', error);
      res.status(500).json({
        error: error.message || 'Google authentication failed',
        details: error.response?.data || null
      });
    }
  }
}

export default new GoogleAuthController();