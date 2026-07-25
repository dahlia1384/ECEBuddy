interface Props {
  topics: string[];
  selected: string;
  onSelect: (topic: string) => void;
}

export default function TopicSelector({ topics, selected, onSelect }: Props) {
  return (
    <select
      value={selected}
      onChange={(e) => onSelect(e.target.value)}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium shadow-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:w-auto dark:border-slate-800 dark:bg-slate-900"
    >
      {topics.map((topic) => (
        <option key={topic} value={topic}>
          {topic}
        </option>
      ))}
    </select>
  );
}
