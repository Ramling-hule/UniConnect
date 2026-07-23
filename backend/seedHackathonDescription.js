import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hackathon from './src/models/Hackathon.js';
import User from './src/models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function seedHackathon() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const htmlDescription = `
    <h3>🚀 Overview</h3>
    <p>Get ready for the ultimate AI showdown! AI Innovators 2026 is the premier platform for the brightest minds to showcase their artificial intelligence, machine learning, and data science prowess.</p>
    
    <h3>📋 Rules & Guidelines</h3>
    <ul>
      <li><strong>Team Size:</strong> 1 to 4 members per team.</li>
      <li><strong>Originality:</strong> All code must be written during the hackathon. Pre-existing code must be disclosed.</li>
      <li><strong>Submission:</strong> A working prototype and a short demo video are required.</li>
      <li><strong>Code of Conduct:</strong> Respect, collaboration, and sportsmanship are mandatory.</li>
    </ul>

    <h3>📅 Stages and Timelines</h3>
    <ol>
      <li>
        <strong>Ideation Phase</strong> (Starts: Oct 1, 2026)
        <br/><em>Submit your groundbreaking ideas and abstracts.</em>
      </li>
      <li>
        <strong>Development Phase</strong> (Starts: Oct 10, 2026)
        <br/><em>Shortlisted teams start building their prototypes. Mentorship sessions included!</em>
      </li>
      <li>
        <strong>Grand Finale</strong> (Starts: Oct 20, 2026)
        <br/><em>Live pitches to our panel of expert judges.</em>
      </li>
    </ol>

    <h3>🎯 Eligibility</h3>
    <p>Open to all undergraduate and postgraduate students globally. Professionals with less than 2 years of experience can also participate.</p>
  `;

  // Get a random user to be the organizer
  const organizer = await User.findOne({ visibility: 'PUBLIC' });

  const hackathonData = {
    title: 'AI Innovators 2026',
    slug: 'ai-innovators-2026',
    tagline: 'Build the future of AI today.',
    description: htmlDescription,
    banner: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80',
    organizer: organizer ? organizer._id : null,
    timeline: {
      registrationOpen: new Date('2026-08-01'),
      registrationClose: new Date('2026-09-30'),
      hackathonStart: new Date('2026-10-01'),
      hackathonEnd: new Date('2026-10-25'),
      resultDeclaration: new Date('2026-11-01')
    },
    mode: 'online',
    isFree: true,
    registrationFee: 0,
    minTeamSize: 1,
    maxTeamSize: 4,
    soloAllowed: true,
    status: 'published',
    visibility: 'public',
    isFeatured: true,
    tracks: [
      { name: 'Generative AI', description: 'Build novel applications using GenAI' },
      { name: 'AI for Good', description: 'Solve real-world problems with AI' }
    ],
    prizes: [
      { rank: '1st Place', title: 'Grand Champion', amount: 100000 },
      { rank: '2nd Place', title: 'Runner Up', amount: 50000 },
      { rank: '3rd Place', title: 'Second Runner Up', amount: 25000 }
    ],
    faqs: [
      { question: 'Who can participate?', answer: 'Anyone globally.' },
      { question: 'Is it free?', answer: 'Yes, 100% free to register.' }
    ],
    skills: ['Machine Learning', 'Python', 'React', 'Generative AI']
  };

  await Hackathon.findOneAndUpdate(
    { slug: 'ai-innovators-2026' },
    hackathonData,
    { upsert: true, new: true }
  );

  console.log('Successfully seeded AI Innovators 2026.');
  process.exit(0);
}

seedHackathon().catch(err => {
  console.error(err);
  process.exit(1);
});
