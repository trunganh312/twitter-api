import { createHash } from 'node:crypto';
import { envConfig } from '~/constants/config';
function sha256(content: string) {
  return createHash('sha256').update(content).digest('hex');
}

export const hashPassword = (password: string) => {
  return sha256(password + envConfig.passwordSecret);
};

// Random password
export function generatePass() {
  let pass = '';
  const str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + 'abcdefghijklmnopqrstuvwxyz0123456789@#$';

  for (let i = 1; i <= 8; i++) {
    const char = Math.floor(Math.random() * str.length + 1);

    pass += str.charAt(char);
  }

  return pass;
}
