export interface EquationEntry {
  label: string;
  latex: string;
}

export interface TopicEquations {
  title: string;
  equations: EquationEntry[];
}

export const EQUATIONS_INFO: TopicEquations[] = [
  {
    title: "Circuit Analysis",
    equations: [
      { label: "Ohm's law", latex: "V = IR" },
      { label: "Kirchhoff's current law", latex: "\\sum I_{in} = \\sum I_{out}" },
      { label: "Kirchhoff's voltage law", latex: "\\sum_{k} V_k = 0" },
      { label: "Power", latex: "P = VI = I^2R = \\dfrac{V^2}{R}" },
      { label: "Capacitor current", latex: "i(t) = C\\dfrac{dv}{dt}" },
      { label: "Inductor voltage", latex: "v(t) = L\\dfrac{di}{dt}" },
    ],
  },
  {
    title: "Signals & Systems",
    equations: [
      { label: "Convolution", latex: "y(t) = \\int_{-\\infty}^{\\infty} x(\\tau)h(t-\\tau)\\,d\\tau" },
      { label: "Fourier transform", latex: "X(f) = \\int_{-\\infty}^{\\infty} x(t)e^{-j2\\pi ft}\\,dt" },
      { label: "Laplace transform", latex: "X(s) = \\int_{0}^{\\infty} x(t)e^{-st}\\,dt" },
      { label: "Nyquist sampling rate", latex: "f_s \\geq 2f_{max}" },
    ],
  },
  {
    title: "Digital Logic Design",
    equations: [
      { label: "De Morgan's (NAND form)", latex: "\\overline{A \\cdot B} = \\overline{A} + \\overline{B}" },
      { label: "De Morgan's (NOR form)", latex: "\\overline{A + B} = \\overline{A} \\cdot \\overline{B}" },
      { label: "D flip-flop next state", latex: "Q_{next} = D" },
      { label: "JK flip-flop next state", latex: "Q_{next} = J\\overline{Q} + \\overline{K}Q" },
    ],
  },
  {
    title: "Electromagnetics",
    equations: [
      { label: "Gauss's law", latex: "\\oint \\vec{E}\\cdot d\\vec{A} = \\dfrac{Q_{enc}}{\\varepsilon_0}" },
      { label: "Faraday's law", latex: "\\oint \\vec{E}\\cdot d\\vec{l} = -\\dfrac{d\\Phi_B}{dt}" },
      { label: "Ampère's law", latex: "\\oint \\vec{B}\\cdot d\\vec{l} = \\mu_0 I_{enc}" },
      { label: "Speed of light", latex: "c = \\dfrac{1}{\\sqrt{\\mu_0 \\varepsilon_0}}" },
    ],
  },
  {
    title: "Semiconductor Devices",
    equations: [
      { label: "Diode current", latex: "I_D = I_S\\left(e^{V_D/V_T} - 1\\right)" },
      { label: "BJT current gain", latex: "I_C = \\beta I_B" },
      { label: "MOSFET saturation current", latex: "I_D = \\tfrac{1}{2}k_n\\left(V_{GS}-V_{th}\\right)^2" },
    ],
  },
  {
    title: "Computer Architecture",
    equations: [
      { label: "CPU execution time", latex: "T_{CPU} = IC \\times CPI \\times T_{clock}" },
      { label: "Amdahl's law", latex: "Speedup = \\dfrac{1}{(1-f) + f/S}" },
      { label: "Avg. memory access time", latex: "AMAT = T_{hit} + MissRate \\times T_{miss}" },
    ],
  },
  {
    title: "Control Systems",
    equations: [
      { label: "Transfer function", latex: "G(s) = \\dfrac{Y(s)}{X(s)}" },
      { label: "Closed-loop transfer function", latex: "T(s) = \\dfrac{G(s)}{1 + G(s)H(s)}" },
      { label: "2nd-order natural frequency", latex: "\\omega_n = \\sqrt{\\dfrac{k}{m}}" },
    ],
  },
  {
    title: "Probability & Random Processes",
    equations: [
      { label: "Expectation", latex: "E[X] = \\sum_i x_i P(x_i)" },
      { label: "Variance", latex: "Var(X) = E[X^2] - (E[X])^2" },
      { label: "Bayes' theorem", latex: "P(A\\mid B) = \\dfrac{P(B\\mid A)P(A)}{P(B)}" },
    ],
  },
  {
    title: "Embedded Systems",
    equations: [
      { label: "Clock period", latex: "T_{clk} = \\dfrac{1}{f_{clk}}" },
      { label: "Dynamic power", latex: "P_{dyn} = C V^2 f" },
    ],
  },
  {
    title: "Communication Systems",
    equations: [
      { label: "Shannon capacity", latex: "C = B\\log_2(1 + SNR)" },
      { label: "SNR in decibels", latex: "SNR_{dB} = 10\\log_{10}\\!\\left(\\dfrac{P_{signal}}{P_{noise}}\\right)" },
    ],
  },
];
