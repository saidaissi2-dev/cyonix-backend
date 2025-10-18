const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

async function sendWelcomeEmail({ email, firstname, commonName, p12Password, certificateDownloadUrl }) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'ProCyberShield <noreply@cyonix.eu>',
    to: email,
    subject: '🎉 Bienvenue sur ProCyberShield !',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { 
            background: linear-gradient(135deg, #FF4B8B 0%, #8B5CF6 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 10px 10px 0 0;
          }
          .content { 
            background: #f9f9f9; 
            padding: 30px; 
            border-radius: 0 0 10px 10px;
          }
          .button { 
            background: #FF4B8B; 
            color: white !important; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            display: inline-block; 
            margin: 20px 0;
          }
          .certificate-box { 
            background: white; 
            border: 2px solid #00D9FF; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 10px; 
          }
          .password-display {
            background: #f0f0f0;
            padding: 10px;
            font-family: monospace;
            font-size: 16px;
            border-radius: 5px;
            border: 1px solid #ddd;
            word-break: break-all;
          }
          .warning {
            color: #ff6b6b;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bienvenue sur ProCyberShield !</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${firstname}</strong>,</p>
            
            <p>Félicitations ! Votre abonnement ProCyberShield est maintenant actif.</p>
            
            <div class="certificate-box">
              <h3>🔐 Votre Certificat de Sécurité</h3>
              <p><strong>Common Name:</strong> ${commonName}</p>
              <p><strong>Mot de passe du certificat:</strong></p>
              <div class="password-display">${p12Password}</div>
              <p class="warning">⚠️ Conservez ce mot de passe précieusement ! Vous en aurez besoin pour installer votre certificat.</p>
            </div>
            
            <h3>📋 Prochaines étapes :</h3>
            <ol>
              <li>Téléchargez votre certificat depuis votre dashboard</li>
              <li>Suivez le guide de configuration VPN</li>
              <li>Connectez-vous en toute sécurité !</li>
            </ol>
            
            <p style="text-align: center;">
              <a href="${certificateDownloadUrl}" class="button">Accéder au Dashboard</a>
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            
            <p><strong>Besoin d'aide ?</strong></p>
            <ul>
              <li>📧 Email: support@cyonix.eu</li>
              <li>💬 WhatsApp: <a href="https://wa.me/33622633554">+33 6 22 63 35 54</a></li>
              <li>📖 <a href="${process.env.FRONTEND_URL}/support">Centre d'aide</a></li>
            </ul>
            
            <p>Merci de votre confiance,<br>
            <strong>L'équipe ProCyberShield</strong></p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', email);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}

async function sendPaymentFailedEmail({ email, firstname, invoiceUrl }) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'ProCyberShield <noreply@cyonix.eu>',
    to: email,
    subject: '⚠️ Échec du paiement - ProCyberShield',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { 
            background: #ff6b6b; 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 10px 10px 0 0;
          }
          .content { 
            background: #f9f9f9; 
            padding: 30px; 
            border-radius: 0 0 10px 10px;
          }
          .button { 
            background: #FF4B8B; 
            color: white !important; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            display: inline-block; 
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Échec du paiement</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${firstname}</strong>,</p>
            
            <p>Nous n'avons pas pu traiter votre paiement pour votre abonnement ProCyberShield.</p>
            
            <p><strong>Que se passe-t-il ?</strong></p>
            <ul>
              <li>Votre carte bancaire a peut-être expiré</li>
              <li>Vous avez peut-être des fonds insuffisants</li>
              <li>Votre banque a peut-être bloqué le paiement</li>
            </ul>
            
            <p><strong>Action requise :</strong></p>
            <p>Mettez à jour vos informations de paiement pour continuer à profiter de ProCyberShield.</p>
            
            <p style="text-align: center;">
              <a href="${invoiceUrl}" class="button">Mettre à jour le paiement</a>
            </p>
            
            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
            
            <p>Cordialement,<br>
            <strong>L'équipe ProCyberShield</strong></p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Payment failed email sent to:', email);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}

module.exports = {
  sendWelcomeEmail,
  sendPaymentFailedEmail
};
