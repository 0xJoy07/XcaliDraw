/**
 * Enforces that an environment variable is set.
 * Throws a loud error on startup if missing, preventing silent fallbacks.
 * 
 * @param {string} name - The name of the environment variable
 * @returns {string} The value of the environment variable
 */
export const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
};
