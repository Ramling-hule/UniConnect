export const extractErrorMessage = (err, fallbackMsg = 'An unexpected error occurred') => {
  if (err?.response?.data?.message) {
    return err.response.data.message;
  }
  if (err?.issues && Array.isArray(err.issues)) {
    return err.issues.map(i => i.message).join(', ');
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallbackMsg;
};
