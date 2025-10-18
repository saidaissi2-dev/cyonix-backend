const { User } = require('../models');
const logger = require('../utils/logger');

class UserController {
  /**
   * PUT /api/user/profile
   * Update user profile
   */
  async updateProfile(req, res, next) {
    try {
      const { firstname, lastname, phone } = req.body;

      const user = await User.findByPk(req.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Update only provided fields
      const updates = {};
      if (firstname !== undefined) updates.firstname = firstname;
      if (lastname !== undefined) updates.lastname = lastname;
      if (phone !== undefined) updates.phone = phone;

      await user.update(updates);

      logger.info(`Profile updated for user: ${user.id}`);

      res.json({
        success: true,
        message: 'Profil mis à jour',
        data: {
          user: user.toSafeObject()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/user/profile
   * Get user profile
   */
  async getProfile(req, res, next) {
    try {
      const user = await User.findByPk(req.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      res.json({
        success: true,
        data: {
          user: user.toSafeObject()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/user/account
   * Delete user account
   */
  async deleteAccount(req, res, next) {
    try {
      const user = await User.findByPk(req.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Soft delete - change status instead of hard delete
      await user.update({ status: 'deleted' });

      logger.info(`Account deleted for user: ${user.id}`);

      res.json({
        success: true,
        message: 'Compte supprimé avec succès'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();