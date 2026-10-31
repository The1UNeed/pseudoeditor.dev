import type { Doc } from "../types";

export const softwareEn: Doc[] = [
  {
    slug: "operating-systems",
    unit: "software",
    title: "System software, operating systems, and interrupts",
    description: "The difference between system and application software, what an operating system does, and how interrupts work.",
    updated: "2026-10-31",
    syllabus: "4.1",
    sections: [
      {
        heading: "System software and application software",
        body: [
          "**Application software** lets the user do a task: write an essay, edit a photo, browse the web, play a game.",
          "**System software** runs and maintains the computer itself and provides a platform for applications to run on. It includes the operating system and **utility software** such as anti-virus, defragmentation, backup, and compression tools.",
        ],
      },
      {
        heading: "Layers of a computer",
        body: [
          "Each layer relies on the one beneath it. Applications ask the operating system for what they need; the operating system controls the hardware, starting from the firmware that runs when the power comes on.",
        ],
        visual: {
          kind: "structure",
          root: {
            label: "User",
            children: [
              {
                label: "Applications",
                children: [{ label: "Operating system", children: [{ label: "Firmware", children: [{ label: "Hardware" }] }] }],
              },
            ],
          },
        },
        caption: "**Firmware** is software stored in ROM, such as the bootloader, which loads the operating system when the computer starts.",
      },
      {
        heading: "What the operating system does",
        body: ["The operating system (OS), such as Windows, macOS, Android, or Linux, manages everything:"],
        visual: {
          kind: "table",
          columns: ["Function", "What it means"],
          rows: [
            ["Managing files", "Create, name, open, move, copy, and delete files and folders."],
            ["Handling interrupts", "Respond to signals that need the CPU's attention."],
            ["Providing a user interface", "A graphical (GUI) or command-line interface so people can use the computer."],
            ["Managing peripherals and drivers", "Communicate with devices like printers through driver software."],
            ["Managing memory", "Decide which programs and data are in RAM, and stop programs using each other's memory."],
            ["Managing multitasking", "Share CPU time between many programs so they appear to run at once."],
            ["Providing a platform for applications", "Give applications a consistent way to use the hardware."],
            ["Providing system security", "User accounts, passwords, access rights, and updates."],
            ["Managing user accounts", "Separate settings and files for each user."],
          ],
        },
      },
      {
        heading: "Interrupts",
        body: [
          "An **interrupt** is a signal sent to the CPU to say that something needs attention. A **hardware interrupt** comes from a device, such as a key being pressed or a printer running out of paper. A **software interrupt** comes from a program, such as a division by zero or a request for data.",
          "At the end of each fetch-decode-execute cycle, the CPU checks for interrupts:",
        ],
        visual: {
          kind: "flow",
          nodes: [
            { label: "Interrupt sent", detail: "It is given a priority and queued." },
            { label: "Check at end of cycle", detail: "The CPU checks if an interrupt is higher priority than the current task." },
            { label: "Save and handle", detail: "The current task's state is saved and an interrupt service routine (ISR) runs." },
            { label: "Resume", detail: "The saved state is restored and the original task carries on." },
          ],
        },
      },
    ],
    keyTerms: [
      { term: "Application software", definition: "Software that lets the user perform a task." },
      { term: "System software", definition: "Software that runs and maintains the computer, such as the OS and utilities." },
      { term: "Firmware", definition: "Software stored in ROM that controls hardware, such as the bootloader." },
      { term: "Interrupt", definition: "A signal to the CPU that an event needs attention." },
    ],
    quiz: [
      { question: "Is a web browser system software or application software?", answer: "**Application software.** It lets the user do a task." },
      { question: "Give three functions of an operating system.", answer: "Any three, for example: managing files, handling interrupts, providing a user interface, managing memory, multitasking, managing peripherals, security." },
      { question: "Give one example of a hardware interrupt and one of a software interrupt.", answer: "Hardware: a key pressed, printer out of paper. Software: division by zero, a program requesting input." },
    ],
  },
  {
    slug: "languages-and-translators",
    unit: "software",
    title: "Programming languages, translators, and IDEs",
    description: "High-level and low-level languages, assembly, compilers versus interpreters, and the tools an IDE gives you.",
    updated: "2026-10-31",
    syllabus: "4.2",
    sections: [
      {
        heading: "High-level and low-level languages",
        body: [
          "A CPU can only run **machine code**: binary instructions from its instruction set. People write programs in languages that are easier to understand, and those programs must be translated.",
        ],
        visual: {
          kind: "table",
          columns: ["", "High-level", "Low-level"],
          rows: [
            ["Examples", "Python, Java, Visual Basic, pseudocode", "Assembly language, machine code"],
            ["Readability", "Close to English, easy to read and debug", "Hard to read; uses mnemonics or binary"],
            ["Portability", "Runs on different CPUs once translated for each", "Written for one type of CPU"],
            ["Control", "Hardware details are hidden", "Direct control of memory and registers"],
            ["Used for", "Most programs", "Device drivers, embedded systems, speed-critical code"],
          ],
        },
      },
      {
        heading: "Assembly language",
        body: [
          "Assembly language uses short **mnemonics** such as `LDA`, `ADD`, and `STO` instead of binary. Each mnemonic matches one machine code instruction. An **assembler** translates assembly into machine code.",
        ],
        example: `LDA 0110   ; load the value at address 0110
ADD 0111   ; add the value at address 0111
STO 0112   ; store the result at address 0112`,
        exampleLanguage: "text",
      },
      {
        heading: "Compilers and interpreters",
        body: [
          "High-level code is translated by a **compiler** or an **interpreter**.",
        ],
        visual: {
          kind: "table",
          columns: ["", "Compiler", "Interpreter"],
          rows: [
            ["How", "Translates the whole program in one go into an executable file", "Translates and runs one line at a time"],
            ["Errors", "Reports all errors after trying to compile the whole program", "Stops at the first error it finds"],
            ["Running again", "The executable runs without the compiler, quickly", "Needs the interpreter every time, slower"],
            ["Source code", "Not needed to run, so it can be kept private", "Must be supplied to run"],
            ["Best for", "Distributing a finished program", "Writing and debugging a program"],
          ],
        },
        callout: { tone: "tip", text: "PseudoEditor's compiler checks your whole program and lists every error with its line number before anything runs." },
      },
      {
        heading: "Integrated development environments (IDEs)",
        body: ["An IDE is a single program with the tools a programmer needs:"],
        bullets: [
          "**Code editor** with features such as syntax highlighting, auto-completion, auto-indentation, and prettyprint.",
          "**Run-time environment** to run and test the program.",
          "**Translator**: a built-in compiler or interpreter.",
          "**Error diagnostics** that show where errors are and suggest fixes.",
          "**Debugging tools** such as breakpoints, stepping line by line, and watching variable values.",
        ],
      },
    ],
    keyTerms: [
      { term: "Machine code", definition: "Binary instructions a CPU can execute directly." },
      { term: "Assembler", definition: "Translates assembly language into machine code." },
      { term: "Compiler", definition: "Translates a whole high-level program into machine code at once." },
      { term: "Interpreter", definition: "Translates and executes a high-level program one line at a time." },
      { term: "IDE", definition: "Integrated development environment: software with tools for writing and testing code." },
    ],
    quiz: [
      { question: "Give two reasons to write a program in a high-level language.", answer: "It is easier to read, write, and debug, and it is portable between different types of computer." },
      { question: "Why might a developer use an interpreter while writing a program?", answer: "It stops at the first error and shows where it is, so errors can be found and fixed one at a time, and the program can be tested without compiling it all." },
      { question: "Why might a company distribute a compiled program instead of its source code?", answer: "The executable runs without a translator and the source code stays private, so it cannot easily be copied or changed." },
    ],
  },
];
