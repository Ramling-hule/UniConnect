/**
 * Extracts a safe error message string from various error shapes.
 * Works seamlessly with Axios errors and standard JS Errors.
 *
 * @param {Error|any} err
 * @param {string} fallbackMsg
 * @returns {string}
 */
export const extractErrorMessage = (err, fallbackMsg = 'An unexpected error occurred') => {
  // Axios error with backend response object { message: "..." }
  if (err?.response?.data?.message) {
    return err.response.data.message;
  }
  
  // Zod error (if passed from our backend validations or frontend hooks)
  if (err?.issues && Array.isArray(err.issues)) {
    return err.issues.map(i => i.message).join(', ');
  }

  // Standard JS Error or Axios error with generic message
  if (err instanceof Error) {
    return err.message;
  }

  // Fallback
  return fallbackMsg;
};
