/**
 * Normalize an email address by:
 * - Converting to lowercase
 * - Removing periods from the local part (before the @)
 * - Replacing 'googlemail' with 'gmail' in the domain
 * 
 * @param {string} email - The email address to normalize
 * @returns {string} - The normalized email or 'error' if normalization failed
 */
export default function normalizeEmail(email) {
  try {
      // Basic validation and lowercase conversion
      if (!email || !(/^[a-z0-9\.]+@[a-z0-9]+\.[a-z0-9\.]+$/i).test(email)) {
          return 'error';
      }
      const lowerEmail = email.toLowerCase();
      const [localPart, domain] = lowerEmail.split("@");

      // Remove periods from the local part
      const normalizedLocalPart = localPart.replace(/\./g, "");
      
      // Normalize domain
      const normalizedDomain = domain.replace("googlemail", 'gmail');

      if (!normalizedLocalPart || !normalizedDomain) {
          return 'error';
      }
      return `${normalizedLocalPart}@${normalizedDomain}`;
  } catch (error) {
      return 'error';
  }
}