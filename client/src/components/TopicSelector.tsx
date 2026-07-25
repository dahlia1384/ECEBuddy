interface Props {
  topics: string[];
  selected: string;
  onSelect: (topic: string) => void;
}

export default function TopicSelector({ topics, selected, onSelect }: Props) {
  return (
    <select
      className="topic-selector"
      value={selected}
      onChange={(e) => onSelect(e.target.value)}
    >
      {topics.map((topic) => (
        <option key={topic} value={topic}>
          {topic}
        </option>
      ))}
    </select>
  );
}
