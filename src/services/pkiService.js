const { NodeSSH } = require('node-ssh');
const path = require('path');
const fs = require('fs').promises;

const ssh = new NodeSSH();

async function connectToVPSPKI() {
  try {
    await ssh.connect({
      host: process.env.PKI_HOST,
      username: process.env.PKI_USER,
      privateKey: process.env.PKI_SSH_KEY
    });
    console.log('Connected to PKI VPS');
    return ssh;
  } catch (error) {
    console.error('SSH connection error:', error);
    throw new Error('Impossible de se connecter au serveur PKI');
  }
}

async function generateCertificate({ commonName, p12Password }) {
  let sshConnection;

  try {
    console.log(`Starting certificate generation for: ${commonName}`);

    sshConnection = await connectToVPSPKI();

    const buildCommand = `cd /etc/openvpn/easy-rsa && ./easyrsa build-client-full ${commonName} nopass`;
    const buildResult = await sshConnection.execCommand(buildCommand);

    if (buildResult.code !== 0) {
      console.error('Build client error:', buildResult.stderr);
      throw new Error(`Erreur lors de la génération du certificat: ${buildResult.stderr}`);
    }

    console.log('Client certificate built successfully');

    const p12Command = `cd /etc/openvpn/easy-rsa/pki && openssl pkcs12 -export \
      -out /tmp/${commonName}.p12 \
      -inkey private/${commonName}.key \
      -in issued/${commonName}.crt \
      -certfile ca.crt \
      -passout pass:${p12Password}`;

    const p12Result = await sshConnection.execCommand(p12Command);

    if (p12Result.code !== 0) {
      console.error('PKCS12 creation error:', p12Result.stderr);
      throw new Error(`Erreur lors de la création du fichier .p12: ${p12Result.stderr}`);
    }

    console.log('PKCS12 file created successfully');

    const localCertDir = process.env.PKI_CERTIFICATES_PATH || '/var/certificates';
    await fs.mkdir(localCertDir, { recursive: true, mode: 0o700 });

    const localPath = path.join(localCertDir, `${commonName}.p12`);
    await sshConnection.getFile(localPath, `/tmp/${commonName}.p12`);

    console.log('Certificate downloaded to:', localPath);

    await sshConnection.execCommand(`rm -f /tmp/${commonName}.p12`);

    sshConnection.dispose();

    return localPath;

  } catch (error) {
    console.error('Certificate generation error:', error);
    if (sshConnection) {
      sshConnection.dispose();
    }
    throw error;
  }
}

async function revokeCertificate(commonName) {
  let sshConnection;

  try {
    console.log(`Revoking certificate for: ${commonName}`);

    sshConnection = await connectToVPSPKI();

    const revokeCommand = `cd /etc/openvpn/easy-rsa && ./easyrsa revoke ${commonName}`;
    const revokeResult = await sshConnection.execCommand(revokeCommand);

    if (revokeResult.code !== 0 && !revokeResult.stderr.includes('already revoked')) {
      console.error('Revoke error:', revokeResult.stderr);
      throw new Error(`Erreur lors de la révocation: ${revokeResult.stderr}`);
    }

    const crlCommand = `cd /etc/openvpn/easy-rsa && ./easyrsa gen-crl`;
    const crlResult = await sshConnection.execCommand(crlCommand);

    if (crlResult.code !== 0) {
      console.error('CRL generation error:', crlResult.stderr);
      throw new Error(`Erreur lors de la génération de la CRL: ${crlResult.stderr}`);
    }

    console.log('Certificate revoked and CRL updated');

    sshConnection.dispose();

    return true;

  } catch (error) {
    console.error('Certificate revocation error:', error);
    if (sshConnection) {
      sshConnection.dispose();
    }
    throw error;
  }
}

async function checkPKIConnection() {
  let sshConnection;

  try {
    sshConnection = await connectToVPSPKI();
    
    const result = await sshConnection.execCommand('echo "PKI OK"');
    
    sshConnection.dispose();
    
    return result.code === 0;

  } catch (error) {
    console.error('PKI connection check error:', error);
    if (sshConnection) {
      sshConnection.dispose();
    }
    return false;
  }
}

module.exports = {
  generateCertificate,
  revokeCertificate,
  checkPKIConnection
};
