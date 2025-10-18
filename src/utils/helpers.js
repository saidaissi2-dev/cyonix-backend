const crypto = require('crypto');

const helpers = {
  /**
   * Generate random password for P12 certificate
   * @param {number} length - Length of password
   * @returns {string} Random password
   */
  generateRandomPassword(length = 16) {
    return crypto.randomBytes(length).toString('hex').substring(0, length);
  },

  /**
   * Generate random token for password reset
   * @returns {string} Random token
   */
  generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  },

  /**
   * Format common name from firstname and lastname
   * @param {string} firstname
   * @param {string} lastname
   * @returns {string} Common name (e.g., john.doe)
   */
  formatCommonName(firstname, lastname) {
    const cleanFirstname = firstname.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]/g, '');
    
    const cleanLastname = lastname.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    
    return `${cleanFirstname}.${cleanLastname}`;
  },

  /**
   * Calculate subscription end date
   * @param {Date} startDate
   * @param {number} months
   * @returns {Date}
   */
  calculateSubscriptionEnd(startDate = new Date(), months = 1) {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);
    return endDate;
  },

  /**
   * Calculate certificate expiry date
   * @param {Date} issuedDate
   * @param {number} days
   * @returns {Date}
   */
  calculateCertificateExpiry(issuedDate = new Date(), days = 365) {
    const expiryDate = new Date(issuedDate);
    expiryDate.setDate(expiryDate.getDate() + days);
    return expiryDate;
  },

  /**
   * Sanitize user input to prevent XSS
   * @param {string} input
   * @returns {string}
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  /**
   * Format error message for user
   * @param {Error} error
   * @returns {string}
   */
  formatErrorMessage(error) {
    if (process.env.NODE_ENV === 'production') {
      return 'Une erreur est survenue. Veuillez réessayer.';
    }
    return error.message;
  }
};

module.exports = helpers;