export const ECE_TOPICS = [
  "Circuit Analysis",
  "Signals & Systems",
  "Digital Logic Design",
  "Electromagnetics",
  "Semiconductor Devices",
  "Computer Architecture",
  "Control Systems",
  "Probability & Random Processes",
  "Embedded Systems",
  "Communication Systems",
] as const;

export type EceTopic = (typeof ECE_TOPICS)[number];

export function isEceTopic(value: string): value is EceTopic {
  return (ECE_TOPICS as readonly string[]).includes(value);
}
