import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Mentor from './src/models/Mentor.js';
import MentorService from './src/models/MentorService.js';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const existing = await Mentor.countDocuments();
  if (existing > 0) {
    console.log('Mentors already exist. Skipping seed.');
    process.exit(0);
  }

  const mentorsData = [
    { name: 'Sarah Drasner', role: 'VP of Engineering', company: 'Netlify', exp: 12 },
    { name: 'Dan Abramov', role: 'Software Engineer', company: 'Meta', exp: 10 },
    { name: 'Guillermo Rauch', role: 'CEO', company: 'Vercel', exp: 15 },
  ];

  for (const data of mentorsData) {
    const email = `${data.name.replace(/\s+/g, '').toLowerCase()}@example.com`;
    let user = await User.findOne({ email });
    if (!user) {
      const password = await bcrypt.hash('password123', 10);
      user = await User.create({
        name: data.name,
        email,
        password,
        username: data.name.replace(/\s+/g, '').toLowerCase(),
        role: 'user',
        visibility: 'PUBLIC',
        headline: `${data.role} @ ${data.company}`
      });
    }

    const mentor = await Mentor.create({
      user: user._id,
      headline: `${data.role} @ ${data.company}`,
      about: `I am a ${data.role} with ${data.exp} years of experience in the industry. Let's chat!`,
      company: data.company,
      role: data.role,
      yearsOfExperience: data.exp,
      skills: ['React', 'Node.js', 'System Design', 'Leadership'],
      languages: ['English'],
      isApproved: true,
      status: 'approved',
      totalSessions: Math.floor(Math.random() * 50) + 10,
      averageRating: 4.5 + Math.random() * 0.5,
      totalReviews: Math.floor(Math.random() * 20) + 5
    });

    await MentorService.create({
      mentor: mentor._id,
      title: '1:1 Mentorship Session',
      description: 'A 30-minute call to discuss career, resume, or technical topics.',
      price: 500,
      duration: 30,
      meetingType: 'online',
      isActive: true
    });
  }

  console.log('Mentors seeded successfully.');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
