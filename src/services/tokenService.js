const jwt = require('jsonwebtoken');
const { Session } = require('../models');
const logger = require('../utils/logger');

class TokenService {
  /**
   * Generate access token
   * @param {Object} payload - User data
   * @returns {string} JWT access token
   */
  generateAccessToken(payload) {
    return jwt.sign(
      payload,
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
    );
  }

  /**
   * Generate refresh token
   * @param {Object} payload - User data
   * @returns {string} JWT refresh token
   */
  generateRefreshToken(payload) {
    return jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );
  }

  /**
   * Verify access token
   * @param {string} token
   * @returns {Object} Decoded token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
      logger.error('Access token verification failed:', error.message);
      throw new Error('Token invalide ou expiré');
    }
  }

  /**
   * Verify refresh token
   * @param {string} token
   * @returns {Object} Decoded token
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      logger.error('Refresh token verification failed:', error.message);
      throw new Error('Refresh token invalide ou expiré');
    }
  }

  /**
   * Create session with refresh token
   * @param {string} userId
   * @param {string} refreshToken
   * @param {Object} req - Express request object
   * @returns {Promise<Object>} Session object
   */
  async createSession(userId, refreshToken, req) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    return Session.create({
      user_id: userId,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });
  }

  /**
   * Invalidate session (logout)
   * @param {string} refreshToken
   * @returns {Promise<boolean>}
   */
  async invalidateSession(refreshToken) {
    try {
      const result = await Session.destroy({
        where: { refresh_token: refreshToken }
      });
      return result > 0;
    } catch (error) {
      logger.error('Error invalidating session:', error);
      return false;
    }
  }

  /**
   * Invalidate all user sessions
   * @param {string} userId
   * @returns {Promise<number>} Number of sessions deleted
   */
  async invalidateAllUserSessions(userId) {
    try {
      return await Session.destroy({
        where: { user_id: userId }
      });
    } catch (error) {
      logger.error('Error invalidating all user sessions:', error);
      return 0;
    }
  }

  /**
   * Clean expired sessions
   * @returns {Promise<number>} Number of sessions deleted
   */
  async cleanExpiredSessions() {
    try {
      const result = await Session.destroy({
        where: {
          expires_at: {
            [require('sequelize').Op.lt]: new Date()
          }
        }
      });
      logger.info(`Cleaned ${result} expired sessions`);
      return result;
    } catch (error) {
      logger.error('Error cleaning expired sessions:', error);
      return 0;
    }
  }
}

module.exports = new TokenService();