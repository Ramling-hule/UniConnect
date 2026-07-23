import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

export const registerSchema = z.object({
  name: z.string().min(2, "Full Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  institute: z.string().min(2, "Institute Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().regex(passwordRegex, "Password must be at least 8 characters, contain one uppercase, one lowercase, one number, and one special character")
});

export const mentorSchema = z.object({
  headline: z.string().min(5, "Headline must be at least 5 characters"),
  about: z.string().min(20, "About section must be at least 20 characters"),
  company: z.string().min(2, "Company name is required"),
  role: z.string().min(2, "Role is required"),
  yearsOfExperience: z.coerce.number().min(0, "Experience cannot be negative"),
  skills: z.string().min(2, "Please provide at least one skill"),
  languages: z.string().min(2, "Please provide at least one language"),
  linkedin: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  portfolio: z.string().url("Must be a valid URL").optional().or(z.literal(''))
});

export const postSchema = z.object({
  content: z.string().min(1, "Post content cannot be empty").max(2000, "Post is too long")
});

export const groupSchema = z.object({
  name: z.string().min(3, "Group name must be at least 3 characters").max(50, "Group name is too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description is too long"),
  memberLimit: z.coerce.number().min(2, "Limit must be at least 2").max(1000, "Maximum limit is 1000")
});

export const checkoutSchema = z.object({
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  notes: z.string().optional()
});
export const getZodError = (error) => {
  if (error instanceof z.ZodError) {
    return error.issues[0].message;
  }
  return "Validation failed";
};
