import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';

dotenv.config();

const firstNames = ["Rahul", "Priya", "Anjali", "Vikram", "Sneha", "Karan", "Pooja", "Amit", "Neha", "Rohan", "Aditi", "Suresh", "Kavya", "Arjun", "Divya", "Siddharth", "Meera", "Varun", "Riya", "Nikhil", "Nidhi", "Abhinav", "Ishita", "Tarun", "Aisha"];
const lastNames = ["Sharma", "Patel", "Singh", "Kumar", "Gupta", "Verma", "Reddy", "Jain", "Das", "Bose", "Menon", "Nair", "Rao", "Iyer", "Pillai", "Choudhury", "Bhatt", "Chauhan", "Tiwari", "Mishra", "Joshi", "Desai", "Agarwal", "Dubey", "Yadav"];

const institutes = [
  "IIT Bombay", "IIT Delhi", "IIT Kanpur", "IIT Kharagpur", "IIT Madras", 
  "BITS Pilani", "NIT Trichy", "NIT Surathkal", "NIT Warangal", 
  "Delhi University", "Jadavpur University", "Anna University", 
  "VIT Vellore", "SRM University", "Manipal Institute of Technology",
  "Pune University", "Mumbai University", "Bangalore University"
];

const companies = ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Google", "Microsoft", "Amazon", "Flipkart", "Paytm", "Zomato", "Swiggy", "Ola", "Freshworks", "Zoho"];

const studentSkills = ["C++", "Java", "Python", "Data Structures", "Algorithms", "Web Development", "HTML/CSS", "JavaScript", "React", "Node.js", "SQL", "Machine Learning basics"];
const professionalSkills = ["React", "Angular", "Vue.js", "Node.js", "Express", "MongoDB", "PostgreSQL", "AWS", "Docker", "Kubernetes", "System Design", "Microservices", "Spring Boot", "Python", "Django", "Data Engineering"];

const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomElements = (arr, count) => {
  const shuffled = arr.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const password = 'Password123!';

    let createdCount = 0;

    for (let i = 1; i <= 50; i++) {
      const firstName = randomElement(firstNames);
      const lastName = randomElement(lastNames);
      const institute = randomElement(institutes);
      const isProfessional = Math.random() > 0.5; // 50% chance to be a professional
      
      const email = `user${i}@example.com`;
      const username = `user_${firstName.toLowerCase()}_${i}`;

      let user = await User.findOne({ email });
      if (!user) {
        let headline, about, experience, education, skills;

        if (isProfessional) {
          const company = randomElement(companies);
          const role = randomElement(["Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Data Analyst"]);
          headline = `${role} at ${company} | Ex-${institute.split(' ')[0]}`;
          about = `Experienced ${role} with a strong background in building scalable applications. Passionate about coding and open source.`;
          experience = [{
            company,
            role,
            startDate: `20${randomInt(18, 22)}-01-01`,
            endDate: "Present",
            description: `Working as a ${role} focusing on core product development.`
          }];
          education = [{
            institution: institute,
            degree: "B.Tech in Computer Science",
            yearOfGraduation: randomInt(2018, 2022)
          }];
          skills = randomElements(professionalSkills, 5);
        } else {
          headline = `Computer Science Student at ${institute} | Aspiring SDE`;
          about = `Final year student at ${institute} with a keen interest in competitive programming and web development. Looking for internships!`;
          experience = [];
          education = [{
            institution: institute,
            degree: "B.Tech in Computer Science",
            yearOfGraduation: randomInt(2024, 2027)
          }];
          skills = randomElements(studentSkills, 5);
        }

        user = new User({
          name: `${firstName} ${lastName}`,
          email,
          password: password,
          username,
          institute,
          role: 'student',
          isVerified: true,
          headline,
          about,
          skills,
          experience,
          education,
          location: randomElement(["Bangalore, India", "Mumbai, India", "Delhi, India", "Hyderabad, India", "Pune, India", "Chennai, India"]),
          points: randomInt(10, 500)
        });
        await user.save();
        createdCount++;
        console.log(`Seeded user ${i}/50: ${firstName} ${lastName} (${isProfessional ? 'Professional' : 'Student'})`);
      } else {
        console.log(`User ${email} already exists.`);
      }
    }

    console.log(`✅ Successfully seeded ${createdCount} users!`);
    console.log('You can log in to any of them using:');
    console.log('Email: user1@example.com (up to user50@example.com)');
    console.log('Password: Password123!');

  } catch (err) {
    console.error('Error seeding users:', err);
  } finally {
    mongoose.connection.close();
  }
};

seedUsers();
