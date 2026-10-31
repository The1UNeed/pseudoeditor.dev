import type { Doc } from "../types";

export const hardwareEn: Doc[] = [
  {
    slug: "cpu-and-fde-cycle",
    unit: "hardware",
    title: "The CPU and the fetch-decode-execute cycle",
    description: "Von Neumann architecture, the CPU's registers and buses, the fetch-decode-execute cycle, and what makes a CPU faster.",
    updated: "2026-10-31",
    syllabus: "3.1",
    sections: [
      {
        heading: "What the CPU does",
        body: [
          "The **central processing unit (CPU)** processes instructions and data. Programs and their data are held in memory (RAM). The CPU fetches each instruction from memory, works out what it means, and carries it out, billions of times a second.",
          "In the **Von Neumann architecture**, instructions and data are stored together in the same memory, and the CPU works through them one instruction at a time.",
        ],
      },
      {
        heading: "Inside the CPU",
        body: ["The CPU has three kinds of part: the control unit, the arithmetic logic unit, and a set of small, very fast storage locations called registers."],
        visual: {
          kind: "table",
          columns: ["Part", "Job"],
          rows: [
            ["**CU** control unit", "Decodes instructions and sends control signals to manage the rest of the CPU and memory."],
            ["**ALU** arithmetic logic unit", "Does calculations (+, −) and logical operations (AND, OR, comparisons)."],
            ["**PC** program counter", "Holds the address of the **next** instruction to fetch."],
            ["**MAR** memory address register", "Holds the address in memory that is about to be read from or written to."],
            ["**MDR** memory data register", "Holds the data or instruction just read from memory, or about to be written to it."],
            ["**CIR** current instruction register", "Holds the instruction currently being decoded and executed."],
            ["**ACC** accumulator", "Holds the result of calculations done by the ALU."],
          ],
        },
      },
      {
        heading: "Buses",
        body: ["Buses are sets of parallel wires that connect the CPU to memory:"],
        bullets: [
          "**Address bus:** carries an address from the MAR to memory. One direction only.",
          "**Data bus:** carries data and instructions between the CPU and memory. Both directions.",
          "**Control bus:** carries signals such as read, write, and clock pulses from the CU. Both directions.",
        ],
      },
      {
        heading: "The fetch-decode-execute cycle",
        body: [
          "Step through the cycle below. The memory holds a tiny program: `LDA 0110` means \"load the value stored at address 0110 into the accumulator\". Watch the values move between registers.",
        ],
        visualTitle: "Fetch-decode-execute",
        visual: {
          kind: "cpu",
          steps: [
            {
              title: "Fetch 1: the PC holds the next address",
              detail: "The program counter holds 0100, the address of the next instruction.",
              active: ["pc"],
              values: { pc: "0100" },
            },
            {
              title: "Fetch 2: copy the PC into the MAR",
              detail: "The address 0100 is copied from the PC to the MAR.",
              active: ["pc", "mar"],
              values: { mar: "0100" },
            },
            {
              title: "Fetch 3: read from memory",
              detail: "The MAR's address goes along the address bus, the CU sends a read signal on the control bus, and the instruction at 0100 comes back along the data bus into the MDR.",
              active: ["mar", "cu", "memory", "mdr"],
              buses: ["address", "control", "data"],
              values: { mdr: "LDA 0110" },
            },
            {
              title: "Fetch 4: increment the PC",
              detail: "The PC goes up by 1 to 0101, ready for the next cycle.",
              active: ["pc"],
              values: { pc: "0101" },
            },
            {
              title: "Fetch 5: copy the instruction into the CIR",
              detail: "The instruction is copied from the MDR to the CIR.",
              active: ["mdr", "cir"],
              values: { cir: "LDA 0110" },
            },
            {
              title: "Decode",
              detail: "The control unit decodes the instruction in the CIR: load the value from address 0110.",
              active: ["cu", "cir"],
            },
            {
              title: "Execute 1: fetch the data",
              detail: "Address 0110 is put in the MAR and read from memory. The value 0005 arrives in the MDR.",
              active: ["mar", "memory", "mdr", "cu"],
              buses: ["address", "control", "data"],
              values: { mar: "0110", mdr: "0005" },
            },
            {
              title: "Execute 2: store the result",
              detail: "The value is copied into the accumulator. Then the cycle starts again with the instruction at 0101.",
              active: ["mdr", "acc"],
              values: { acc: "0005" },
            },
          ],
        },
        caption: "Every program you run is this cycle repeated billions of times.",
      },
      {
        heading: "What makes a CPU faster",
        visual: {
          kind: "table",
          columns: ["Factor", "What it is", "Why it helps"],
          rows: [
            ["Clock speed", "Number of FDE cycles per second, in GHz", "More cycles per second, so more instructions processed"],
            ["Cores", "Separate processing units inside one CPU", "Several instructions can be processed at the same time"],
            ["Cache", "Very fast memory inside the CPU", "Frequently used data and instructions are fetched without going to slower RAM"],
          ],
        },
        body: [],
        callout: { tone: "warn", text: "Doubling the cores does not always double the speed. Some programs cannot be split into parts that run at once, and cores have to coordinate." },
      },
      {
        heading: "Instruction sets and embedded systems",
        body: [
          "An **instruction set** is the list of all the machine code commands a CPU can understand and carry out, such as load, add, store, and jump.",
          "An **embedded system** is a computer built into a larger device to do one dedicated job, such as the controller in a washing machine, a microwave, a car's engine management, or a heating thermostat. Embedded systems are small, cheap, and use little power, but they are hard to upgrade.",
        ],
      },
    ],
    keyTerms: [
      { term: "Von Neumann architecture", definition: "A design where instructions and data share the same memory." },
      { term: "Register", definition: "A small, very fast storage location inside the CPU." },
      { term: "Bus", definition: "A set of parallel wires that carries addresses, data, or control signals." },
      { term: "Cache", definition: "Small, fast memory in the CPU that stores frequently used data and instructions." },
      { term: "Embedded system", definition: "A computer system built into a device to perform a dedicated function." },
    ],
    quiz: [
      { question: "Which register holds the address of the next instruction?", answer: "The **program counter (PC)**." },
      { question: "Describe what happens to the MAR and MDR during the fetch stage.", answer: "The address from the PC is copied into the MAR. The instruction at that address is read from memory along the data bus into the MDR." },
      { question: "Why does a larger cache improve performance?", answer: "More frequently used data and instructions can be kept in fast cache, so the CPU waits less for slower RAM." },
      { question: "Give two examples of embedded systems.", answer: "For example: a washing machine controller, a microwave, a smart thermostat, a car's anti-lock braking system." },
    ],
  },
  {
    slug: "input-output-devices",
    unit: "hardware",
    title: "Input devices, output devices, and sensors",
    description: "How common input and output devices work, and which sensor to pick for a job.",
    updated: "2026-10-31",
    syllabus: "3.2",
    sections: [
      {
        heading: "Input and output",
        body: [
          "An **input device** captures data from the outside world and turns it into binary for the computer. An **output device** turns binary from the computer into something people can see, hear, or touch, or into movement.",
        ],
        visual: {
          kind: "flow",
          nodes: [
            { label: "Input device", detail: "Keyboard, scanner, sensor..." },
            { label: "Processor", detail: "Processes the binary data" },
            { label: "Output device", detail: "Screen, printer, speaker, actuator..." },
          ],
        },
      },
      {
        heading: "Input devices",
        visual: {
          kind: "table",
          columns: ["Device", "How it works / what it is for"],
          rows: [
            ["Barcode scanner", "Shines light on the bars; black bars reflect less than white gaps. The pattern is turned into the product's number."],
            ["QR code scanner", "A camera captures the 2D square pattern, which can store far more data than a barcode, such as a web address."],
            ["Digital camera", "Light passes through a lens onto a sensor made of millions of light-sensitive pixels."],
            ["Keyboard", "Each key press completes a circuit; the key's character code is sent to the computer."],
            ["Microphone", "Sound vibrates a diaphragm, which creates an electrical signal that is sampled into binary."],
            ["Optical mouse", "An LED lights the surface and a sensor tracks how the surface image moves."],
            ["2D and 3D scanners", "Light (2D) or lasers (3D) measure an object to create a digital image or 3D model."],
            ["Touch screen", "**Resistive:** two layers are pressed together. **Capacitive:** a finger changes the screen's electric field. **Infra-red:** a finger breaks a grid of invisible beams."],
          ],
        },
        body: [],
      },
      {
        heading: "Output devices",
        visual: {
          kind: "table",
          columns: ["Device", "How it works / what it is for"],
          rows: [
            ["Actuator", "A motor, valve, or pump that creates movement, controlled by a computer."],
            ["DLP and LCD projectors", "Project a large image. DLP uses millions of tiny mirrors; LCD shines light through a liquid crystal panel."],
            ["Inkjet printer", "Sprays tiny droplets of ink onto paper. Cheap to buy, good for photos."],
            ["Laser printer", "Uses a laser, a charged drum, and powder toner. Fast and cheap per page for large volumes."],
            ["3D printer", "Builds a solid object layer by layer, often from melted plastic."],
            ["LED and LCD screens", "Grids of pixels. LCD screens use liquid crystals with a backlight; LED screens light each pixel or use LEDs as the backlight."],
            ["Speaker", "An electrical signal moves a coil and cone, which vibrates the air to make sound."],
          ],
        },
        body: [],
      },
      {
        heading: "Sensors",
        body: [
          "A **sensor** is an input device that measures a physical property and sends the reading to a computer. Sensors produce analogue data, which is converted to digital before processing. Match the sensor to what needs measuring:",
        ],
        visual: {
          kind: "table",
          columns: ["Sensor", "Measures", "Used in"],
          rows: [
            ["Temperature", "Heat", "Central heating, greenhouses"],
            ["Light", "Brightness", "Automatic street lights, phone screens"],
            ["Infra-red", "Heat / movement of bodies", "Burglar alarms, automatic doors"],
            ["Pressure", "Force or weight", "Burglar alarms, car tyres"],
            ["Proximity", "How close an object is", "Parking sensors, phones near your ear"],
            ["Moisture / humidity", "Water in soil / in the air", "Crop irrigation, greenhouses"],
            ["Acoustic", "Sound", "Noise monitoring, voice control"],
            ["Accelerometer", "Acceleration and tilt", "Phones rotating the screen, airbags"],
            ["Gas", "Levels of a gas such as CO₂", "Air quality, gas leak alarms"],
            ["pH", "Acidity", "Water treatment, soil testing"],
            ["Flow / level", "Movement / height of a liquid", "Water supplies, fuel tanks"],
            ["Magnetic field", "Changes in a magnetic field", "Phone compasses, door sensors"],
          ],
        },
        callout: { tone: "tip", text: "In an exam scenario, name the sensor and say what it measures in that context, for example \"a moisture sensor measures how wet the soil is\"." },
      },
    ],
    keyTerms: [
      { term: "Input device", definition: "Hardware that sends data into a computer." },
      { term: "Output device", definition: "Hardware that presents results from a computer." },
      { term: "Sensor", definition: "An input device that measures a physical property, such as temperature." },
      { term: "Actuator", definition: "An output device that causes movement, such as a motor or valve." },
    ],
    quiz: [
      { question: "Which type of touch screen works by a finger breaking invisible beams?", answer: "**Infra-red** touch screen." },
      { question: "A school prints 2000 worksheets a day. Which printer suits it best, and why?", answer: "A **laser printer**: it is fast and has a low cost per page for large volumes." },
      { question: "Which sensor should a smart greenhouse use to decide when to water plants?", answer: "A **moisture** sensor in the soil." },
    ],
  },
  {
    slug: "storage",
    unit: "hardware",
    title: "Primary storage, secondary storage, and the cloud",
    description: "RAM and ROM, magnetic, optical, and solid-state storage, virtual memory, and cloud storage.",
    updated: "2026-10-31",
    syllabus: "3.3",
    sections: [
      {
        heading: "Primary storage",
        body: [
          "**Primary storage** is directly accessed by the CPU. It holds the data and instructions currently in use.",
        ],
        visual: {
          kind: "table",
          columns: ["", "RAM", "ROM"],
          rows: [
            ["Full name", "Random access memory", "Read only memory"],
            ["Volatile?", "Yes: contents lost when power is off", "No: contents kept without power"],
            ["Can be changed?", "Read and write", "Read only"],
            ["Holds", "Programs and data currently in use, including parts of the OS", "The start-up instructions (bootstrap / BIOS)"],
          ],
        },
        callout: { tone: "key", text: "Volatile means the data disappears when the power is switched off." },
      },
      {
        heading: "Secondary storage",
        body: [
          "**Secondary storage** is non-volatile and keeps files permanently. It is not directly accessed by the CPU: data has to be loaded into RAM first. There are three technologies:",
        ],
        visual: {
          kind: "table",
          columns: ["Type", "How it works", "Examples", "Strengths", "Weaknesses"],
          rows: [
            ["Magnetic", "Platters spin; a read/write head magnetises tiny areas to store 1s and 0s", "Hard disk drive (HDD)", "Large capacity, low cost per GB", "Moving parts, slower, can be damaged if dropped"],
            ["Optical", "A laser reads pits and lands burned onto the disc surface", "CD, DVD, Blu-ray", "Cheap, portable", "Small capacity, slow, easily scratched"],
            ["Solid-state", "Transistors (NAND flash) trap electrons to store data; no moving parts", "SSD, USB stick, SD card", "Very fast, robust, silent, low power", "Higher cost per GB, limited number of writes"],
          ],
        },
      },
      {
        heading: "Virtual memory",
        body: [
          "When RAM is full, the operating system can use part of secondary storage as **virtual memory**. Data that is not needed right now is moved out of RAM to make room, and swapped back in when it is needed.",
          "This stops the computer crashing when RAM runs out, but secondary storage is much slower than RAM, so if a lot of swapping happens the computer slows down badly (disk thrashing).",
        ],
        visual: {
          kind: "flow",
          nodes: [
            { label: "RAM is full", detail: "A program needs more memory." },
            { label: "Move out", detail: "Data not in use is moved from RAM to virtual memory on the disk." },
            { label: "Load in", detail: "The needed data takes its place in RAM." },
            { label: "Swap back", detail: "When the moved data is needed again, it is swapped back into RAM." },
          ],
        },
      },
      {
        heading: "Cloud storage",
        body: [
          "**Cloud storage** keeps your files on remote servers owned by a provider and accessed over the internet. The data is actually stored on many physical servers, often copied in several places.",
        ],
        bullets: [
          "**Benefits:** access files from any device with internet; easy to share; the provider handles backups and security; pay for only the space you need.",
          "**Drawbacks:** no internet means no access; you rely on the provider's security; ongoing subscription costs; uploads and downloads use bandwidth.",
        ],
      },
    ],
    keyTerms: [
      { term: "Primary storage", definition: "Storage directly accessed by the CPU: RAM and ROM." },
      { term: "Secondary storage", definition: "Non-volatile storage for keeping files permanently." },
      { term: "Volatile", definition: "Loses its contents when the power is turned off." },
      { term: "Virtual memory", definition: "Secondary storage used as an extension of RAM when RAM is full." },
      { term: "Cloud storage", definition: "Storing data on remote servers accessed over the internet." },
    ],
    quiz: [
      { question: "Why is the start-up program stored in ROM instead of RAM?", answer: "ROM is non-volatile, so the instructions are still there when the computer is switched on, and they cannot be accidentally changed." },
      { question: "Give two reasons a laptop might use an SSD instead of an HDD.", answer: "SSDs have no moving parts so they are more robust if dropped; they are faster, lighter, quieter, and use less power." },
      { question: "Why can heavy use of virtual memory make a computer slow?", answer: "Secondary storage is much slower than RAM, so swapping data back and forth takes time." },
    ],
  },
  {
    slug: "network-hardware",
    unit: "hardware",
    title: "Network hardware and addresses",
    description: "Network interface cards, MAC addresses, IPv4 and IPv6 addresses, and what a router does.",
    updated: "2026-10-31",
    syllabus: "3.4",
    sections: [
      {
        heading: "Network interface card (NIC)",
        body: [
          "To connect to a network, a device needs a **network interface card (NIC)**, which may be wired or wireless. Every NIC is given a unique **MAC address** when it is made.",
        ],
      },
      {
        heading: "MAC addresses",
        body: [
          "A MAC (media access control) address is 48 bits long, normally written as 12 hex digits. The first half identifies the **manufacturer** and the second half is the device's **serial number**.",
        ],
        visual: {
          kind: "segments",
          segments: [
            { label: "00-1A-2B", detail: "Manufacturer ID (first 24 bits)." },
            { label: "3C-4D-5E", detail: "Serial number of the device (last 24 bits)." },
          ],
        },
        callout: { tone: "key", text: "A MAC address identifies the device itself and normally never changes." },
      },
      {
        heading: "IP addresses",
        body: [
          "An **IP address** identifies a device on a network such as the internet, so data can be sent to it. Unlike a MAC address, it depends on the network the device is connected to.",
        ],
        visual: {
          kind: "table",
          columns: ["", "IPv4", "IPv6"],
          rows: [
            ["Length", "32 bits", "128 bits"],
            ["Written as", "4 denary numbers 0–255, separated by dots", "8 groups of 4 hex digits, separated by colons"],
            ["Example", "`192.168.0.12`", "`2001:0db8:85a3:0000:0000:8a2e:0370:7334`"],
            ["Why", "The original format", "IPv4 is running out of addresses; IPv6 has vastly more"],
          ],
        },
      },
      {
        heading: "Static and dynamic",
        body: [
          "A **static** IP address is assigned permanently and does not change. It suits servers, which must always be found at the same address.",
          "A **dynamic** IP address is assigned each time a device connects and can change. It suits most home devices, and addresses can be reused when devices disconnect.",
        ],
      },
      {
        heading: "Routers",
        body: [
          "A **router** connects networks together and forwards packets between them. It reads the destination IP address in each packet header and sends the packet towards that address. A home router connects your local network to the internet and usually assigns dynamic IP addresses to the devices on it.",
        ],
      },
    ],
    keyTerms: [
      { term: "NIC", definition: "Network interface card: hardware that connects a device to a network." },
      { term: "MAC address", definition: "A unique 48-bit identifier given to a NIC by the manufacturer." },
      { term: "IP address", definition: "An address that identifies a device on a network." },
      { term: "Router", definition: "A device that forwards packets between networks using IP addresses." },
    ],
    quiz: [
      { question: "What do the two halves of a MAC address identify?", answer: "The first half is the manufacturer; the second half is the device's serial number." },
      { question: "Why was IPv6 introduced?", answer: "IPv4's 32 bits give about 4.3 billion addresses, which are running out. IPv6's 128 bits give vastly more." },
      { question: "Why should a web server have a static IP address?", answer: "Its address must not change, so users and DNS can always find it at the same address." },
    ],
  },
];
