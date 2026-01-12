export default function ProfileAbout({ about }) {
  if (!about) return null;
  return (
    <div className="p-6 rounded-2xl border shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800">
      <h3 className="font-bold text-lg mb-3 dark:text-white">About</h3>
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
        {about}
      </p>
    </div>
  );
}