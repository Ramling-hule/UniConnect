import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Pod from './src/models/Pod.js';
import PodMember from './src/models/PodMember.js';
import User from './src/models/User.js';
import Mentor from './src/models/Mentor.js';

dotenv.config();

const seedPods = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const mentors = await Mentor.find({ status: 'approved' }).populate('user');
    if (mentors.length === 0) {
      console.log('No mentors found to assign to pods.');
      process.exit(1);
    }

    const mentor1 = mentors[0].user;
    const mentor2 = mentors.length > 1 ? mentors[1].user : mentor1;
    const pod1 = await Pod.create({
      name: "React Performance Tuning Cohort",
      goal: "Master advanced React rendering and Next.js optimization",
      description: "A highly focused 4-week pod. We will dive deep into React reconciler, memoization, Server Components, and Turbopack.",
      mentorId: mentor1._id,
      status: 'FORMING',
      minSize: 3,
      maxSize: 6,
      schedule: { timezone: "PST", liveSessionDay: "Saturday", liveSessionTime: "10:00 AM" },
      requirements: { skillLevel: 'INTERMEDIATE', language: 'English' }
    });

    const pod2 = await Pod.create({
      name: "System Design for FAANG",
      goal: "Crack scalable system design interviews",
      description: "We will go over load balancers, caching, sharding, and real-world system design questions.",
      mentorId: mentor2._id,
      status: 'ACTIVE',
      minSize: 4,
      maxSize: 5,
      schedule: { timezone: "IST", liveSessionDay: "Sunday", liveSessionTime: "08:00 PM" },
      requirements: { skillLevel: 'ADVANCED', language: 'English' }
    });
    const users = await User.find({ role: 'student' }).limit(3);
    for (const user of users) {
      await PodMember.create({
        podId: pod2._id,
        userId: user._id,
        role: 'STUDENT',
        status: 'ACTIVE',
        joinedAt: new Date()
      });
    }

    console.log('✅ Successfully seeded pods!');
  } catch (err) {
    console.error('Error seeding pods:', err);
  } finally {
    mongoose.connection.close();
  }
};

seedPods();
