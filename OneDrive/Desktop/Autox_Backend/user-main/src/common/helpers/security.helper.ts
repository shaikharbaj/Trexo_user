import { Injectable } from '@nestjs/common';
import { hash as bcryptHash } from 'bcrypt';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  randomFill,
  scrypt,
} from 'crypto';

@Injectable()
export class SecurityHelper {

  /**
   * @description
   * Function to hashs
   */
  public async hash(data: string) {
    return bcryptHash(data, process.env.HASH_SALT as string);
  }

  public async _encrypt(data: string): Promise<string> {
    const algorithm = 'aes-192-cbc';
    const salt = randomBytes(8).toString('hex');

    return new Promise((resolve, reject) => {
      scrypt(process.env.ENCRYPT_PASSWORD as string, salt, 24, (err, key) => {
        if (err) reject(err);

        randomFill(new Uint8Array(16), (err, iv) => {
          const ivHex = Buffer.from(iv).toString('hex');
          if (err) reject(err);

          const cipher = createCipheriv(algorithm, key, iv);

          let encrypted = cipher.update(data, 'utf8', 'hex');
          encrypted += cipher.final('hex');

          const result = `${salt}|${ivHex}|${encrypted}`;
          resolve(result);
        });
      });
    });
  }

  public async _decrypt(encryptedData: string): Promise<string> {
    const algorithm = 'aes-192-cbc';

    return new Promise((resolve, reject) => {
      const [salt, ivHex, encrypted] = encryptedData.split('|');

      if (!salt || !ivHex || !encrypted) reject(new Error('Invalid data'));

      const iv = Buffer.from(ivHex, 'hex');

      scrypt(process.env.ENCRYPT_PASSWORD as string, salt, 24, (err, key) => {
        if (err) reject(err);

        const decipher = createDecipheriv(algorithm, key, iv);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        resolve(decrypted);
      });
    });
  }

  public async encrypt(data: string) {
    const encrypted = await this._encrypt(data);
    const hashed = await this.hash(data);
    return `${hashed}|${encrypted}`;
  }

  public async decrypt(data: string) {
    const [_, ...rest] = data.split('|');
    const encrypted = rest.join('|');
    return await this._decrypt(encrypted);
  }
}
