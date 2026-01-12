import { Award } from 'lucide-react';

export default function ProfileSkills({ skills = [] }) {
  return (
    <div className="p-6 rounded-2xl border shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-4">
        <Award className="text-brand-primary" size={20} />
        <h3 className="font-bold text-lg dark:text-white">Skills</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
         {skills.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No skills listed.</p>
         ) : skills.map((skill, i) => (
            <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
               {skill}
            </span>
         ))}
      </div>
    </div>
  );
}