const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// JWT Secret Rotation Script
class JWTSecretRotation {
  constructor() {
    this.envPath = path.join(__dirname, '..', '.env.production');
    this.backupPath = path.join(__dirname, '..', '.env.production.backup');
  }

  generateSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
  }

  readEnvFile() {
    try {
      return fs.readFileSync(this.envPath, 'utf8');
    } catch (error) {
      console.error('Error reading env file:', error);
      throw error;
    }
  }

  writeEnvFile(content) {
    try {
      // Backup current file
      const currentContent = this.readEnvFile();
      fs.writeFileSync(this.backupPath, currentContent);
      
      // Write new content
      fs.writeFileSync(this.envPath, content);
      console.log('Environment file updated successfully');
    } catch (error) {
      console.error('Error writing env file:', error);
      throw error;
    }
  }

  rotateSecrets() {
    console.log('Starting JWT secret rotation...');
    
    const envContent = this.readEnvFile();
    const lines = envContent.split('\n');
    
    const newJwtSecret = this.generateSecret();
    const newRefreshSecret = this.generateSecret();
    const newSessionSecret = this.generateSecret();
    
    const updatedLines = lines.map(line => {
      if (line.startsWith('JWT_SECRET=')) {
        return `JWT_SECRET=${newJwtSecret}`;
      } else if (line.startsWith('JWT_REFRESH_SECRET=')) {
        return `JWT_REFRESH_SECRET=${newRefreshSecret}`;
      } else if (line.startsWith('SESSION_SECRET=')) {
        return `SESSION_SECRET=${newSessionSecret}`;
      }
      return line;
    });
    
    const updatedContent = updatedLines.join('\n');
    this.writeEnvFile(updatedContent);
    
    console.log('JWT secrets rotated successfully');
    console.log('Backup saved to:', this.backupPath);
    
    // Log rotation event
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: 'JWT_SECRET_ROTATION',
      status: 'SUCCESS',
      backup: this.backupPath
    };
    
    fs.appendFileSync(
      path.join(__dirname, '..', 'logs', 'security.log'),
      JSON.stringify(logEntry) + '\n'
    );
  }
}

// Run if called directly
if (require.main === module) {
  const rotation = new JWTSecretRotation();
  rotation.rotateSecrets();
}

module.exports = JWTSecretRotation;