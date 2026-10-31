import type { Doc } from "../types";

export const emergingTechEn: Doc[] = [
  {
    slug: "automated-systems-and-robotics",
    unit: "emerging-tech",
    title: "Automated systems and robotics",
    description: "How sensors, a microprocessor, and actuators work together in an automated system, and what makes something a robot.",
    updated: "2026-10-31",
    syllabus: "6.1, 6.2",
    sections: [
      {
        heading: "Automated systems",
        body: [
          "An **automated system** uses sensors, a microprocessor, and actuators to do a job with no human needed. It runs in a continuous loop:",
        ],
        visualTitle: "The control loop",
        visual: {
          kind: "flow",
          layout: "cycle",
          nodes: [
            { label: "Sensor reads", detail: "e.g. a temperature sensor measures the room." },
            { label: "Convert", detail: "The analogue reading is converted to digital." },
            { label: "Microprocessor compares", detail: "The reading is compared with a stored value, such as 21 °C." },
            { label: "Actuator acts", detail: "If needed, a signal turns the heater on or off." },
          ],
        },
      },
      {
        heading: "Example: a greenhouse",
        body: [
          "A moisture sensor measures the soil. The microprocessor compares the reading with the target moisture level. If the soil is too dry, it sends a signal to an actuator that opens a water valve. It keeps checking, and closes the valve when the soil is moist enough.",
          "The same pattern appears in industry (production lines), transport (traffic lights, self-driving trains), agriculture (irrigation), weather stations, gaming, lighting, and science experiments.",
        ],
        bullets: [
          "**Advantages:** faster and more accurate than people; work 24/7 without breaks; safer in dangerous places; lower running costs.",
          "**Disadvantages:** expensive to set up and maintain; can fail if a sensor breaks; reduce some jobs; cannot handle situations they were not programmed for.",
        ],
      },
      {
        heading: "Robotics",
        body: [
          "**Robotics** is the branch of computer science that designs, builds, and operates robots. A robot has three characteristics:",
        ],
        bullets: [
          "**A mechanical structure or framework** that lets it move or interact.",
          "**Electrical components** such as sensors, microprocessors, and actuators.",
          "**It is programmable**, so it can be given instructions to carry out tasks.",
        ],
        visual: {
          kind: "table",
          columns: ["Area", "Robots used for"],
          rows: [
            ["Industry", "Welding, painting, and assembling cars"],
            ["Transport", "Self-driving vehicles, warehouse robots"],
            ["Agriculture", "Fruit picking, weeding, drones that spray crops"],
            ["Medicine", "Surgical robots, delivering medicines in hospitals"],
            ["Domestic", "Robot vacuum cleaners and lawn mowers"],
            ["Entertainment", "Animatronics, camera robots"],
          ],
        },
      },
    ],
    keyTerms: [
      { term: "Automated system", definition: "A combination of software and hardware that performs a task without human intervention." },
      { term: "Microprocessor", definition: "An integrated circuit that processes the sensor data and makes decisions." },
      { term: "Actuator", definition: "A component that produces movement, such as a motor or valve." },
      { term: "Robot", definition: "A programmable machine with a mechanical structure and electrical components." },
    ],
    quiz: [
      { question: "Describe how an automated system keeps a room at 21 °C.", answer: "A temperature sensor sends readings, converted to digital, to a microprocessor. It compares each reading with 21 °C. If lower, it signals an actuator to turn the heater on; if higher, to turn it off. This repeats continuously." },
      { question: "State the three characteristics of a robot.", answer: "A mechanical structure, electrical components (sensors, microprocessors, actuators), and it is programmable." },
    ],
  },
  {
    slug: "artificial-intelligence",
    unit: "emerging-tech",
    title: "Artificial intelligence",
    description: "What makes a system intelligent, how expert systems are built, and how machine learning improves from data.",
    updated: "2026-10-31",
    syllabus: "6.3",
    sections: [
      {
        heading: "What is AI?",
        body: [
          "**Artificial intelligence (AI)** is a branch of computer science that deals with simulating intelligent behaviour by computers. An AI system typically has these characteristics:",
        ],
        bullets: [
          "**It collects data** and uses it.",
          "**It has rules** for using that data.",
          "**It can reason**, applying the rules to make decisions or predictions.",
          "**It can learn and adapt**, changing its own processes and rules based on new data.",
        ],
      },
      {
        heading: "Expert systems",
        body: ["An **expert system** gives advice like a human expert would, for example diagnosing illnesses, identifying minerals, or fixing car faults. It has four parts:"],
        visual: {
          kind: "flow",
          nodes: [
            { label: "User interface", detail: "Asks the user questions and shows conclusions." },
            { label: "Inference engine", detail: "Applies the rules to the user's answers to reach a conclusion." },
            { label: "Rule base", detail: "IF-THEN rules, such as IF temperature > 38 AND rash THEN ..." },
            { label: "Knowledge base", detail: "Facts collected from human experts." },
          ],
        },
        callout: { tone: "tip", text: "The inference engine connects the user interface to the rule base and knowledge base. It asks the next question based on earlier answers." },
      },
      {
        heading: "Machine learning",
        body: [
          "In **machine learning**, a program is not given every rule. It is trained on data and changes its own processes to get better at a task, finding patterns that a person might not spot.",
          "Examples include recommending films based on what you have watched, filtering spam email, recognising faces in photos, and detecting fraudulent card payments.",
        ],
        visual: {
          kind: "flow",
          layout: "cycle",
          nodes: [
            { label: "Train on data", detail: "Thousands of labelled examples." },
            { label: "Predict", detail: "Make a decision on new data." },
            { label: "Check the result", detail: "Was it right?" },
            { label: "Adapt", detail: "Adjust the model to do better next time." },
          ],
        },
      },
    ],
    keyTerms: [
      { term: "Artificial intelligence", definition: "Simulating intelligent behaviour, such as reasoning and learning, by computer." },
      { term: "Expert system", definition: "An AI system that uses a knowledge base and rules to give expert advice." },
      { term: "Inference engine", definition: "The part of an expert system that applies rules to facts to reach conclusions." },
      { term: "Machine learning", definition: "A program that improves its performance by learning from data." },
    ],
    quiz: [
      { question: "Name the four parts of an expert system.", answer: "User interface, inference engine, rule base, and knowledge base." },
      { question: "How does machine learning differ from a normal program?", answer: "A normal program follows fixed rules written by a programmer. A machine learning program changes its own rules based on the data it is trained on." },
    ],
  },
];
