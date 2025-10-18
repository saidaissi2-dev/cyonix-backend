const { Certificate, User } = require('../models');

async function getCertificateInfo(req, res) {
  try {
    const userId = req.user.userId;

    const certificate = await Certificate.findOne({
      where: { 
        user_id: userId,
        revoked: false 
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstname', 'lastname', 'email']
        }
      ],
      order: [['issued_at', 'DESC']]
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Aucun certificat actif trouvé'
      });
    }

    const now = new Date();
    const expiresAt = new Date(certificate.expires_at);
    const daysUntilExpiration = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

    let status = 'valid';
    if (daysUntilExpiration < 0) {
      status = 'expired';
    } else if (daysUntilExpiration <= 30) {
      status = 'expiring_soon';
    }

    return res.status(200).json({
      success: true,
      data: {
        certificate: {
          id: certificate.id,
          commonName: certificate.common_name,
          issuedAt: certificate.issued_at,
          expiresAt: certificate.expires_at,
          revoked: certificate.revoked,
          daysUntilExpiration,
          status,
          serialNumber: certificate.serial_number,
          user: {
            firstname: certificate.user.firstname,
            lastname: certificate.user.lastname,
            email: certificate.user.email
          }
        }
      }
    });

  } catch (error) {
    console.error('Get certificate info error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations du certificat'
    });
  }
}

async function downloadCertificate(req, res) {
  try {
    const userId = req.user.userId;
    const fs = require('fs').promises;

    const certificate = await Certificate.findOne({
      where: { 
        user_id: userId,
        revoked: false 
      },
      order: [['issued_at', 'DESC']]
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Aucun certificat actif trouvé'
      });
    }

    const certificatePath = certificate.certificate_path;
    try {
      await fs.access(certificatePath);
    } catch (error) {
      console.error('Certificate file not found:', certificatePath);
      return res.status(404).json({
        success: false,
        message: 'Fichier certificat introuvable'
      });
    }

    const fileBuffer = await fs.readFile(certificatePath);

    res.setHeader('Content-Type', 'application/x-pkcs12');
    res.setHeader('Content-Disposition', `attachment; filename="${certificate.common_name}.p12"`);
    res.setHeader('Content-Length', fileBuffer.length);

    return res.send(fileBuffer);

  } catch (error) {
    console.error('Download certificate error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement du certificat'
    });
  }
}

async function revokeCertificate(req, res) {
  try {
    const userId = req.user.userId;
    const pkiService = require('../services/pkiService');

    const certificate = await Certificate.findOne({
      where: { 
        user_id: userId,
        revoked: false 
      }
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Aucun certificat actif à révoquer'
      });
    }

    await pkiService.revokeCertificate(certificate.common_name);

    await certificate.update({
      revoked: true,
      revoked_at: new Date()
    });

    return res.status(200).json({
      success: true,
      message: 'Certificat révoqué avec succès'
    });

  } catch (error) {
    console.error('Revoke certificate error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la révocation du certificat'
    });
  }
}

module.exports = {
  getCertificateInfo,
  downloadCertificate,
  revokeCertificate
};
