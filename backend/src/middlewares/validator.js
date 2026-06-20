const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegister = (req, res, next) => {
  const { name, username, email, password } = req.body;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Name must be at least 2 characters.' });
  }

  if (!username || username.trim().length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Username must be at least 3 alphanumeric characters.' });
  }

  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Please enter a valid email address.' });
  }

  if (!password || !passwordRegex.test(password)) {
    return res.status(400).json({ 
      error: 'VALIDATION_ERROR', 
      message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.' 
    });
  }

  next();
};

export const validateResetPassword = (req, res, next) => {
  const { password } = req.body;

  if (!password || !passwordRegex.test(password)) {
    return res.status(400).json({ 
      error: 'VALIDATION_ERROR', 
      message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.' 
    });
  }

  next();
};
