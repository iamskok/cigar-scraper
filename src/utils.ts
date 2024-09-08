import dotenv from 'dotenv';

dotenv.config();

/**
 * Checks if required environment variables are present
 * @param requiredVars - List of required environment variables
 */
export const checkEnvVars = (requiredVars: string[]): void => {
  requiredVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      throw new Error(`Environment variable ${envVar} is not defined.`);
    }
  });
};
