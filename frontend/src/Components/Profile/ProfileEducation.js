import React from 'react';
import { GraduationCap } from 'lucide-react';

export default function ProfileEducation({ education }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="text-brand-primary" size={20} />
        <h3 className="text-lg font-bold dark:text-white">Education</h3>
      </div>

      {!education || education.length === 0 ? (
        <p className="text-slate-500 text-sm">No education info added.</p>
      ) : (
        <div className="space-y-4">
          {education.map((edu, index) => (
            <div key={index} className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">{edu.school}</h4>
              <p className="text-sm text-brand-primary font-medium">{edu.degree}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {edu.from} - {edu.to || 'Present'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}