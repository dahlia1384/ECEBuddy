import type { ReactNode } from "react";

interface IconProps {
  className?: string;
}

function IconWrap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

const CircuitIcon = ({ className }: IconProps) => (
  <IconWrap className={className}>
    <path d="M3 12h3l1.5-4 3 8 1.5-4H21" />
    <circle cx="19.5" cy="12" r="1.5" />
    <circle cx="4.5" cy="12" r="1.5" />
  </IconWrap>
);

const SignalsIcon = ({ className }: IconProps) => (
  <IconWrap className={className}>
    <path d="M2 12c1.5 0 1.5-6 3-6s1.5 12 3 12 1.5-12 3-12 1.5 12 3 12 1.5-12 3-12 1.5 6 3 6h2" />
  </IconWrap>
);

const LogicIcon = ({ className }: IconProps) => (
  <IconWrap className={className}>
    <path d="M4 5v14h5a7 7 0 000-14H4z" />
    <path d="M17 9h3M17 15h3M14 12h3" />
  </IconWrap>
);

const ElectromagneticsIcon = ({ className }: IconProps) => (
  <IconWrap className={className}>
    <circle cx="12" cy="12" r="1.5" />
    <path d="M7.5 7.5a6.5 6.5 0 000 9M16.5 7.5a6.5 6.5 0 010 9M4 4a11 11 0 000 16M20 4a11 11 0 010 16" />
  </IconWrap>
);

const SemiconductorIcon = ({ className }: IconProps) => (
  <IconWrap className={className}>
    <path d="M4 12h6l3-5 3 10 2-5h2" />
    <path d="M10 12l3-5v10z" fill="currentColor" stroke="none" opacity="0.15" />
  </IconWrap>
);

const ArchitectureIcon = ({ className }: IconProps) => (
  <IconWrap className={className}>
    <rect x="7" y="7" width="10" height="10" rx="1" />
    <path d="M9.5 4v3M14.5 4v3M9.5 17v3M14.5 17v3M4 9.5h3M4 14.5h3M17 9.5h3M17 14.5h3" />
  </IconWrap>
);

const ControlIcon = ({ className }: IconProps) => (
  <IconWrap className={className}>
    <path d="M4 12a8 8 0 0114.5-4.6M20 12a8 8 0 01-14.5 4.6" />
    <path d="M18.5 4.5v3.5H15M5.5 19.5V16H9" />
  </IconWrap>
);

const ProbabilityIcon = ({ className }: IconProps) => (
  <IconWrap className={className}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </IconWrap>
);

const EmbeddedIcon = ({ className }: IconProps) => (
  <IconWrap className={className}>
    <rect x="3" y="4" width="18" height="16" rx="1.5" />
    <rect x="8" y="9" width="8" height="6" rx="1" />
    <path d="M8 4v2M12 4v2M16 4v2M8 18v2M12 18v2M16 18v2" />
  </IconWrap>
);

const CommunicationIcon = ({ className }: IconProps) => (
  <IconWrap className={className}>
    <path d="M12 20V10" />
    <path d="M8 20h8" />
    <circle cx="12" cy="6" r="1.4" />
    <path d="M8.5 9a5 5 0 017 0M6 6.5a8.5 8.5 0 0112 0" />
  </IconWrap>
);

export interface TopicInfo {
  title: string;
  description: string;
  Icon: (props: IconProps) => ReactNode;
}

export const TOPIC_INFO: TopicInfo[] = [
  {
    title: "Circuit Analysis",
    description: "KVL/KCL, Thevenin & Norton equivalents, op-amps, and transient RLC response.",
    Icon: CircuitIcon,
  },
  {
    title: "Signals & Systems",
    description: "Convolution, Fourier & Laplace transforms, sampling, and LTI system behavior.",
    Icon: SignalsIcon,
  },
  {
    title: "Digital Logic Design",
    description: "Boolean algebra, combinational & sequential circuits, FSMs, and HDL basics.",
    Icon: LogicIcon,
  },
  {
    title: "Electromagnetics",
    description: "Maxwell's equations, transmission lines, wave propagation, and antenna theory.",
    Icon: ElectromagneticsIcon,
  },
  {
    title: "Semiconductor Devices",
    description: "Diodes, BJTs, MOSFETs, band theory, and small-signal device models.",
    Icon: SemiconductorIcon,
  },
  {
    title: "Computer Architecture",
    description: "Datapath & control, pipelining, memory hierarchy, and ISA design.",
    Icon: ArchitectureIcon,
  },
  {
    title: "Control Systems",
    description: "Feedback loops, stability analysis, root locus, Bode plots, and PID tuning.",
    Icon: ControlIcon,
  },
  {
    title: "Probability & Random Processes",
    description: "Distributions, expectation, random variables, and stochastic process basics.",
    Icon: ProbabilityIcon,
  },
  {
    title: "Embedded Systems",
    description: "Microcontrollers, interrupts, peripherals, RTOS concepts, and firmware design.",
    Icon: EmbeddedIcon,
  },
  {
    title: "Communication Systems",
    description: "Modulation, noise, channel capacity, and analog/digital transmission.",
    Icon: CommunicationIcon,
  },
];
