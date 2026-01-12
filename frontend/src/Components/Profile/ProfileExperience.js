import { Briefcase } from 'lucide-react';

export default function ProfileExperience({ experience = [] }) {
  return (
    <div className="p-6 rounded-2xl border shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="text-brand-primary" size={20} />
        <h3 className="font-bold text-lg dark:text-white">Experience</h3>
      </div>
      
      {experience.length === 0 ? (
        <p className="text-sm text-slate-400 italic">No experience added.</p>
      ) : (
        <div className="space-y-6">
          {experience.map((exp, i) => (
            <div key={i} className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 last:border-0">
               <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-brand-primary border-4 border-white dark:border-slate-900"></div>
               <h4 className="font-bold text-sm dark:text-white">{exp.title}</h4>
               <p className="text-xs font-semibold text-slate-500">{exp.company}</p>
               <p className="text-[10px] text-slate-400 mt-0.5">{exp.startYear} - {exp.endYear}</p>
               {exp.description && <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">{exp.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}