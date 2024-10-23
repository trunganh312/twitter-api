import crypto from 'crypto';
export const generateApiKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

export function isEmptyObject(obj: any) {
  return Object.keys(obj).length === 0;
}

export const enumToArrayNumber = (enums: { [key: string]: string | number }) => {
  return Object.values(enums).filter((value) => typeof value === 'number') as number[];
};
