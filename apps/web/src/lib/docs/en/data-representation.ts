import type { Doc } from "../types";

export const dataRepresentationEn: Doc[] = [
  {
    slug: "number-systems",
    unit: "data-representation",
    title: "Binary, denary, and hexadecimal",
    description: "Why computers count in binary, how to convert between binary, denary, and hex, and where hex is used.",
    updated: "2026-10-31",
    syllabus: "1.1",
    sections: [
      {
        heading: "Why binary?",
        body: [
          "A computer is built from billions of tiny switches called transistors. Each switch is either off or on, so the natural way to store anything is with two digits: **0** and **1**. A single 0 or 1 is a **bit** (binary digit).",
          "Every number, letter, sound, and picture a computer handles is stored as patterns of bits. The data has to be converted to binary before the computer can process it.",
        ],
        callout: { tone: "key", text: "Binary is base 2. Each place is worth double the place to its right: 1, 2, 4, 8, 16, 32, 64, 128." },
      },
      {
        heading: "Place values",
        body: [
          "Denary (base 10) has place values 1, 10, 100, 1000. Binary works the same way with powers of 2. To read a binary number, add up the place values that have a 1 under them.",
          "Try it below. Click any bit to flip it and watch the denary value change. Can you make 75? (Hint: 64 + 8 + 2 + 1.)",
        ],
        visualTitle: "8-bit binary explorer",
        visual: { kind: "binary", value: 75 },
        caption: "8 bits can store 256 different values, from `00000000` (0) to `11111111` (255).",
      },
      {
        heading: "Denary to binary",
        body: [
          "**Method 1, subtract place values:** start from the largest place value that fits, write a 1, subtract, and move right. For 75: 64 fits (11 left), 32 no, 16 no, 8 fits (3 left), 4 no, 2 fits (1 left), 1 fits. So 75 = `01001011`.",
          "**Method 2, divide by 2:** keep dividing by 2 and write down the remainders. Read the remainders from the bottom up.",
        ],
        visualTitle: "75 by repeated division",
        visual: {
          kind: "trace",
          stepper: true,
          columns: ["Number", "÷ 2", "Remainder"],
          rows: [
            ["75", "37", "1"],
            ["37", "18", "1"],
            ["18", "9", "0"],
            ["9", "4", "1"],
            ["4", "2", "0"],
            ["2", "1", "0"],
            ["1", "0", "1"],
          ],
        },
        caption: "Reading the remainders from the bottom up gives `1001011`. Pad to 8 bits: `01001011`.",
      },
      {
        heading: "Hexadecimal",
        body: [
          "Hexadecimal (hex) is base 16. It uses the digits 0–9 and then the letters A–F for 10–15. One hex digit stands for exactly **4 bits** (a nibble), so a byte is always two hex digits.",
          "To convert binary to hex, split the bits into groups of four from the right and convert each group. To go back, turn each hex digit into its 4 bits.",
        ],
        visualTitle: "Binary to hex, one nibble at a time",
        visual: { kind: "binary", value: 183, showHex: true },
        caption: "`1011 0111` → B (11) and 7 → `B7`. In denary that is 11 × 16 + 7 = 183.",
      },
      {
        heading: "Hex to denary and back",
        body: [
          "Hex place values are powers of 16: 1, 16, 256, 4096. So `1F4` = 1 × 256 + 15 × 16 + 4 × 1 = **500**.",
          "To turn denary into hex, the quickest route in an exam is often denary → binary → hex. For 500: `0001 1111 0100` → `1F4`.",
        ],
        visual: {
          kind: "table",
          columns: ["Denary", "Binary", "Hex"],
          rows: [
            ["9", "`1001`", "9"],
            ["10", "`1010`", "A"],
            ["12", "`1100`", "C"],
            ["15", "`1111`", "F"],
            ["16", "`0001 0000`", "10"],
            ["255", "`1111 1111`", "FF"],
          ],
        },
      },
      {
        heading: "Where hex is used",
        body: ["Hex is shorter than binary and easier for people to read and type, with fewer mistakes. You will see it in:"],
        bullets: [
          "**HTML colour codes**, such as `#FF8800` (red FF, green 88, blue 00).",
          "**MAC addresses**, such as `00-1A-2B-3C-4D-5E`.",
          "**Error codes** and memory dumps, such as `0x0000007B`.",
          "**IPv6 addresses**, such as `2001:0db8::ff00:0042`.",
          "**URLs**, where `%20` is the hex code for a space.",
        ],
        callout: { tone: "warn", text: "Hex is a way for humans to write binary. The computer still stores the binary underneath." },
      },
    ],
    keyTerms: [
      { term: "Bit", definition: "A single binary digit, 0 or 1." },
      { term: "Nibble", definition: "4 bits. One hex digit." },
      { term: "Byte", definition: "8 bits. Two hex digits." },
      { term: "Denary", definition: "Base 10, the number system people use every day." },
      { term: "Hexadecimal", definition: "Base 16, using 0–9 and A–F." },
    ],
    quiz: [
      { question: "Convert `10010110` to denary.", answer: "128 + 16 + 4 + 2 = **150**." },
      { question: "Convert 200 to 8-bit binary.", answer: "200 = 128 + 64 + 8 → `11001000`." },
      { question: "Convert `3C` to binary and denary.", answer: "3 → `0011`, C → `1100`, so `00111100`. Denary: 3 × 16 + 12 = **60**." },
      { question: "Give two reasons programmers use hex instead of binary.", answer: "It is shorter, so easier to read and remember, and people make fewer mistakes typing it. It also converts to binary directly." },
    ],
  },
  {
    slug: "binary-arithmetic",
    unit: "data-representation",
    title: "Binary addition, overflow, shifts, and negative numbers",
    description: "Add 8-bit binary numbers, spot overflow, multiply and divide with logical shifts, and store negatives with two's complement.",
    updated: "2026-10-31",
    syllabus: "1.1",
    sections: [
      {
        heading: "Adding binary",
        body: [
          "Binary addition works like column addition in denary, but you carry when a column reaches 2 instead of 10. There are only four rules:",
        ],
        bullets: ["0 + 0 = 0", "0 + 1 = 1", "1 + 1 = 0, carry 1", "1 + 1 + 1 = 1, carry 1"],
        visualTitle: "109 + 59 = 168",
        visual: {
          kind: "table",
          columns: ["", "128", "64", "32", "16", "8", "4", "2", "1"],
          rows: [
            ["Carry", "1", "1", "1", "1", "1", "1", "1", ""],
            ["109", "0", "1", "1", "0", "1", "1", "0", "1"],
            ["59", "0", "0", "1", "1", "1", "0", "1", "1"],
            ["**168**", "**1**", "**0**", "**1**", "**0**", "**1**", "**0**", "**0**", "**0**"],
          ],
        },
        caption: "Work right to left. Write each carry above the next column so you do not lose it.",
      },
      {
        heading: "Overflow",
        body: [
          "An 8-bit register can hold at most 255. If an addition produces a bigger answer, a carry falls off the left end and there is no 9th bit to store it. This is an **overflow error**.",
          "For example, 200 + 100 = 300, which needs 9 bits (`100101100`). The register keeps only the right-hand 8 bits, `00101100`, which is 44. The answer is wrong.",
        ],
        callout: { tone: "tip", text: "When asked to identify overflow, say that the result is larger than the register can hold (more than 255 for 8 bits), so the final carry is lost." },
      },
      {
        heading: "Logical shifts",
        body: [
          "A **logical shift** moves every bit left or right by a number of places. Empty places are filled with 0s, and bits pushed off the end are lost.",
          "Each shift **left** multiplies by 2. Each shift **right** divides by 2. Shifting left 3 places multiplies by 8.",
          "Press the buttons to shift `00010110` (22). Shift left twice to get 88. Keep going and watch what happens when a 1 falls off.",
        ],
        visualTitle: "Shift explorer",
        visual: { kind: "binary", value: 22, showShifts: true },
        caption: "If a 1 is lost from the left, the result is wrong (overflow). If a 1 is lost from the right, the result is rounded down.",
      },
      {
        heading: "Two's complement",
        body: [
          "To store negative numbers, two's complement makes the left-most bit worth **−128** instead of +128. Every other place stays positive. So a number starting with 1 is negative and a number starting with 0 is positive.",
          "8-bit two's complement can store −128 to +127.",
        ],
        visualTitle: "Two's complement explorer",
        visual: { kind: "binary", value: -45, mode: "twos" },
        caption: "`11010011` = −128 + 64 + 16 + 2 + 1 = −45. Flip the left bit to see the sign change.",
      },
      {
        heading: "Making a number negative",
        body: ["To write a negative denary number in two's complement:"],
        visual: {
          kind: "flow",
          nodes: [
            { label: "Write the positive value", detail: "45 → `00101101`" },
            { label: "Flip every bit", detail: "`00101101` → `11010010`" },
            { label: "Add 1", detail: "`11010010` + 1 → `11010011`" },
          ],
        },
        callout: { tone: "tip", text: "To check your answer, add the place values with −128 for the left bit. You should get the number you started with." },
      },
    ],
    keyTerms: [
      { term: "Overflow", definition: "When a result is too large for the number of bits available." },
      { term: "Logical shift", definition: "Moving all bits left or right, filling gaps with 0s." },
      { term: "Most significant bit", definition: "The left-most bit, with the largest place value." },
      { term: "Two's complement", definition: "A way to store negative integers where the most significant bit has a negative place value." },
    ],
    quiz: [
      { question: "Add `01010101` and `00110011`.", answer: "85 + 51 = 136 → `10001000`. No overflow." },
      { question: "What is `00001101` after a logical left shift of 2 places? What has happened to the value?", answer: "`00110100` = 52. It has been multiplied by 4 (13 × 4)." },
      { question: "Convert −20 to 8-bit two's complement.", answer: "20 = `00010100`, flip → `11101011`, add 1 → `11101100`." },
      { question: "What denary value is `10000001` in two's complement?", answer: "−128 + 1 = **−127**." },
    ],
  },
  {
    slug: "text-sound-images",
    unit: "data-representation",
    title: "Representing text, sound, and images",
    description: "Character sets like ASCII and Unicode, how sound is sampled, and how pixels and colour depth make up an image.",
    updated: "2026-10-31",
    syllabus: "1.2",
    sections: [
      {
        heading: "Text and character sets",
        body: [
          "Every character on a keyboard is given a number, and the number is stored in binary. The list of characters and their numbers is a **character set**.",
          "**ASCII** uses 7 bits, giving 128 characters: English letters, digits, punctuation, and control codes. Extended ASCII uses 8 bits for 256 characters.",
          "**Unicode** uses up to 4 bytes per character, so it can represent over a million characters: every writing system, maths symbols, and emoji. The cost is that each character can take more storage than in ASCII.",
        ],
        visual: {
          kind: "table",
          columns: ["Character", "Denary code", "Binary"],
          rows: [
            ["A", "65", "`01000001`"],
            ["B", "66", "`01000010`"],
            ["a", "97", "`01100001`"],
            ["0", "48", "`00110000`"],
            ["space", "32", "`00100000`"],
          ],
        },
        caption: "Codes are in order, so B is one more than A, and lower case is 32 more than upper case.",
      },
      {
        heading: "Sound",
        body: [
          "Sound is a continuous analogue wave. To store it, the computer measures the wave's height (amplitude) at regular intervals. Each measurement is a **sample**.",
          "The **sample rate** is how many samples are taken per second, measured in hertz (Hz). CD audio uses 44,100 Hz. The **sample resolution** (bit depth) is how many bits store each sample, which sets how many different heights can be recorded.",
          "Drag the sliders. With few samples or few bits, the solid line is a blocky copy of the real wave. Turn both up and it follows the curve closely, but the file needs more bits.",
        ],
        visualTitle: "Sampling a sound wave",
        visual: { kind: "sound" },
        caption: "Higher sample rate and higher resolution give a more accurate recording and a bigger file.",
      },
      {
        heading: "Images",
        body: [
          "A bitmap image is a grid of dots called **pixels**. Each pixel's colour is stored as a binary number.",
          "**Resolution** is the number of pixels, written as width × height. **Colour depth** is the number of bits per pixel. 1 bit gives 2 colours, 8 bits give 256, and 24 bits give about 16.7 million.",
          "Paint the image below. With a colour depth of 1, black is 1 and white is 0. Switch the colour depth to see how the file size grows even though the picture has the same number of pixels.",
        ],
        visualTitle: "An 8 × 8 bitmap",
        visual: {
          kind: "pixels",
          rows: ["00111100", "01000010", "10100101", "10000001", "10100101", "10011001", "01000010", "00111100"],
        },
        caption: "Image size in bits = width × height × colour depth.",
      },
      {
        heading: "Quality versus size",
        body: ["In every case, more bits mean better quality but bigger files:"],
        visual: {
          kind: "table",
          columns: ["Increase", "Effect on quality", "Effect on file size"],
          rows: [
            ["Sample rate", "Closer to the original sound", "Larger"],
            ["Sample resolution", "More accurate amplitude, wider dynamic range", "Larger"],
            ["Image resolution", "More detail, less pixelated", "Larger"],
            ["Colour depth", "More colours, smoother shading", "Larger"],
          ],
        },
      },
    ],
    keyTerms: [
      { term: "Character set", definition: "All the characters a computer can represent, each with a unique binary code." },
      { term: "Sample rate", definition: "The number of sound samples taken per second." },
      { term: "Sample resolution", definition: "The number of bits used to store each sound sample." },
      { term: "Pixel", definition: "The smallest single point of colour in a bitmap image." },
      { term: "Colour depth", definition: "The number of bits used to store the colour of each pixel." },
    ],
    quiz: [
      { question: "The ASCII code for 'C' is 67. What is the code for 'E'?", answer: "**69**. Codes run in alphabetical order." },
      { question: "Why might a company choose Unicode instead of ASCII?", answer: "Unicode can represent characters from every language and emoji, so text from any country can be stored." },
      { question: "How many colours can a 4-bit colour depth show?", answer: "2⁴ = **16** colours." },
      { question: "Describe one effect of reducing the sample rate of a recording.", answer: "The file gets smaller, but fewer samples are taken so the sound is less accurate and may lose high frequencies." },
    ],
  },
  {
    slug: "data-storage-compression",
    unit: "data-representation",
    title: "File sizes and compression",
    description: "Storage units from bits to exbibytes, calculating image and sound file sizes, and lossy versus lossless compression.",
    updated: "2026-10-31",
    syllabus: "1.3",
    sections: [
      {
        heading: "Storage units",
        body: ["Data is measured in bytes. Each unit from a kibibyte upwards is 1024 times the one before, because 1024 is 2¹⁰."],
        visual: {
          kind: "table",
          columns: ["Unit", "Size"],
          rows: [
            ["bit", "a single 0 or 1"],
            ["nibble", "4 bits"],
            ["byte (B)", "8 bits"],
            ["kibibyte (KiB)", "1024 bytes"],
            ["mebibyte (MiB)", "1024 KiB"],
            ["gibibyte (GiB)", "1024 MiB"],
            ["tebibyte (TiB)", "1024 GiB"],
            ["pebibyte (PiB)", "1024 TiB"],
            ["exbibyte (EiB)", "1024 PiB"],
          ],
        },
        callout: { tone: "tip", text: "To go down a unit, multiply by 1024. To go up a unit, divide by 1024. To go from bits to bytes, divide by 8." },
      },
      {
        heading: "Calculating file sizes",
        body: [
          "**Image:** size in bits = resolution (width × height) × colour depth.",
          "A 1920 × 1080 photo at 24-bit colour: 1920 × 1080 × 24 = 49,766,400 bits ÷ 8 = 6,220,800 bytes ÷ 1024 ÷ 1024 ≈ **5.93 MiB**.",
          "**Sound:** size in bits = sample rate × sample resolution × length in seconds.",
          "One minute at 44,100 Hz and 16 bits: 44,100 × 16 × 60 = 42,336,000 bits ÷ 8 = 5,292,000 bytes ≈ **5.05 MiB**.",
        ],
        visual: {
          kind: "flow",
          nodes: [
            { label: "Multiply to get bits", detail: "pixels × colour depth, or samples per second × bits × seconds" },
            { label: "÷ 8 for bytes", detail: "8 bits in a byte" },
            { label: "÷ 1024 for each unit up", detail: "bytes → KiB → MiB → GiB" },
          ],
        },
      },
      {
        heading: "Why compress?",
        body: ["Compression makes files smaller. Smaller files:"],
        bullets: [
          "use less storage space on a device or server",
          "take less time to upload, download, and stream",
          "use less bandwidth, so networks are less congested",
        ],
      },
      {
        heading: "Lossless compression",
        body: [
          "Lossless compression shrinks a file **without losing any data**. When it is decompressed you get the exact original back. It is used for text, program files, and anything where every bit matters.",
          "**Run-length encoding (RLE)** is one lossless method. It replaces runs of the same value with a count and the value.",
        ],
        visual: {
          kind: "table",
          columns: ["Original", "RLE", "Values stored"],
          rows: [
            ["`WWWWWWBBBWWWW`", "`6W 3B 4W`", "13 → 6"],
            ["`AAAAAAAABBC`", "`8A 2B 1C`", "11 → 6"],
            ["`ABCD`", "`1A 1B 1C 1D`", "4 → 8 (bigger!)"],
          ],
        },
        caption: "RLE works best with long runs, such as simple images with large areas of one colour.",
      },
      {
        heading: "Lossy compression",
        body: [
          "Lossy compression **permanently removes data** that people are unlikely to notice. The file gets much smaller, but the original can never be fully restored. It suits photos, music, and video, not text or code.",
          "Lossy methods include reducing the resolution or colour depth of an image, reducing the sample rate or resolution of a sound, and removing sounds the human ear cannot hear (as MP3 does).",
        ],
        callout: { tone: "key", text: "Lossless: smaller, original fully restored. Lossy: much smaller, some data gone for good." },
      },
    ],
    keyTerms: [
      { term: "Kibibyte", definition: "1024 bytes (KiB)." },
      { term: "Compression", definition: "Reducing the size of a file." },
      { term: "Lossless", definition: "Compression where no data is lost and the original can be restored exactly." },
      { term: "Lossy", definition: "Compression that permanently removes some data." },
      { term: "Run-length encoding", definition: "Lossless compression that stores repeated values as a count and the value." },
    ],
    quiz: [
      { question: "How many bytes are in 3 KiB?", answer: "3 × 1024 = **3072 bytes**." },
      { question: "Calculate the size in bytes of a 100 × 50 image with a colour depth of 8 bits.", answer: "100 × 50 × 8 = 40,000 bits ÷ 8 = **5000 bytes**." },
      { question: "Why should a text document not be compressed with lossy compression?", answer: "Lossy compression removes data permanently, so characters would be lost and the text would no longer make sense." },
      { question: "Compress `RRRRGGGGGGBB` with RLE.", answer: "`4R 6G 2B`." },
    ],
  },
];
