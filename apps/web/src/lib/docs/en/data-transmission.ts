import type { Doc } from "../types";

export const dataTransmissionEn: Doc[] = [
  {
    slug: "data-transmission",
    unit: "data-transmission",
    title: "Packets and transmission methods",
    description: "How data is split into packets, how packet switching routes them, and serial, parallel, simplex, and duplex transmission.",
    updated: "2026-10-31",
    syllabus: "2.1",
    sections: [
      {
        heading: "Data travels in packets",
        body: [
          "Sending a whole file in one piece would block the network and, if anything went wrong, the whole file would need resending. Instead data is split into small, equal-sized **packets**.",
          "Every packet has three parts:",
        ],
        visualTitle: "Packet structure",
        visual: {
          kind: "segments",
          segments: [
            { label: "Header", detail: "Destination IP address, originator's IP address, and the packet number.", weight: 1 },
            { label: "Payload", detail: "The actual data being carried, a small piece of the file.", weight: 3 },
            { label: "Trailer", detail: "Marks the end of the packet and holds error-checking data, such as a checksum.", weight: 1 },
          ],
        },
      },
      {
        heading: "Packet switching",
        body: [
          "Each packet makes its own way across the network. At every **router** the best available route is chosen, so packets from the same file can take different paths and arrive in a different order.",
        ],
        visual: {
          kind: "flow",
          nodes: [
            { label: "Split", detail: "The file is broken into numbered packets." },
            { label: "Route", detail: "Routers send each packet along the best route at that moment." },
            { label: "Arrive", detail: "Packets reach the destination, possibly out of order." },
            { label: "Reassemble", detail: "Packet numbers put the file back in order. Missing packets are requested again." },
          ],
        },
        callout: { tone: "tip", text: "Benefits: routes avoid busy or broken links, and only lost packets are resent. Drawback: packets can be lost or delayed, and reassembling takes time." },
      },
      {
        heading: "Serial and parallel",
        body: [
          "**Serial** transmission sends bits one after another down a single wire. **Parallel** transmission sends several bits at the same time down several wires.",
        ],
        visual: {
          kind: "table",
          columns: ["", "Serial", "Parallel"],
          rows: [
            ["Wires", "One", "Several (often 8 or more)"],
            ["Speed", "Slower over short distances", "Faster over short distances"],
            ["Distance", "Reliable over long distances", "Bits can arrive out of sync (skew) over long distances"],
            ["Cost", "Cheaper cable", "More expensive cable"],
            ["Example", "USB, connecting to the internet", "Inside a CPU and between chips"],
          ],
        },
      },
      {
        heading: "Simplex, half-duplex, and full-duplex",
        body: ["Direction matters too:"],
        visual: {
          kind: "table",
          columns: ["Method", "Direction", "Example"],
          rows: [
            ["Simplex", "One direction only", "Computer to printer, a radio broadcast"],
            ["Half-duplex", "Both directions, but only one at a time", "Walkie-talkie"],
            ["Full-duplex", "Both directions at the same time", "Phone call, broadband connection"],
          ],
        },
      },
      {
        heading: "USB",
        body: [
          "The Universal Serial Bus (USB) is a standard **serial** interface for connecting devices to a computer.",
        ],
        bullets: [
          "**Benefits:** one standard connector for many devices; devices are detected and drivers loaded automatically; it can power and charge devices; it is backwards compatible.",
          "**Drawbacks:** limited cable length (a few metres); it can be slower than some other connections; older versions transfer data slowly.",
        ],
      },
    ],
    keyTerms: [
      { term: "Packet", definition: "A small unit of data sent across a network, with a header, payload, and trailer." },
      { term: "Packet switching", definition: "Sending packets independently, each taking the best route, then reassembling them." },
      { term: "Router", definition: "A device that directs packets towards their destination." },
      { term: "Serial", definition: "Transmitting one bit at a time down a single wire." },
      { term: "Full-duplex", definition: "Data can travel in both directions at the same time." },
    ],
    quiz: [
      { question: "Name three items stored in a packet header.", answer: "The destination IP address, the originator's IP address, and the packet number." },
      { question: "Why do packets need a packet number?", answer: "Packets can take different routes and arrive out of order, so the number lets them be reassembled in the right order." },
      { question: "Why is serial transmission used for long distances instead of parallel?", answer: "In parallel, bits on different wires can arrive at slightly different times (skew), corrupting data. Serial sends one bit at a time, so this cannot happen, and the cable is cheaper." },
    ],
  },
  {
    slug: "error-detection",
    unit: "data-transmission",
    title: "Detecting errors",
    description: "Why data gets corrupted, and how parity checks, checksums, echo checks, check digits, and ARQ catch the errors.",
    updated: "2026-10-31",
    syllabus: "2.2",
    sections: [
      {
        heading: "Why errors happen",
        body: [
          "On the way from sender to receiver, interference can flip bits, packets can be lost, or data can arrive out of order. The receiver needs a way to notice that the data it got is not what was sent.",
          "Every method below works the same way: the sender adds some extra information calculated from the data, and the receiver recalculates it to see if it still matches.",
        ],
      },
      {
        heading: "Parity check",
        body: [
          "One bit of each byte is used as a **parity bit**. With **even parity**, the parity bit is set so the byte has an even number of 1s. With **odd parity**, the total number of 1s is odd.",
          "The receiver counts the 1s. If the count is wrong for the agreed parity, an error has happened. Try flipping one bit below, then two.",
        ],
        visualTitle: "Parity checker",
        visual: { kind: "parity", value: 0b1011001 },
        caption: "Parity spots any odd number of flipped bits, but if two bits flip the count stays correct and the error is missed.",
      },
      {
        heading: "Parity blocks",
        body: [
          "A **parity block** adds a parity bit to every byte (row) and a parity bit for every column. The column parity bits together form a **parity byte** under the block. If one bit is wrong, its row and its column will both fail, and where they cross shows exactly which bit to correct.",
        ],
      },
      {
        heading: "Checksum",
        body: [
          "The sender adds up the bytes in a block of data using an agreed calculation and sends the result, the **checksum**, with the data. The receiver does the same calculation. If its answer is different, the data is corrupted and is requested again.",
        ],
      },
      {
        heading: "Echo check",
        body: [
          "The receiver sends a copy of the data straight back. The sender compares the copy with the original. If they differ, the data is sent again.",
        ],
        callout: { tone: "warn", text: "An echo check cannot tell whether the error happened on the way there or on the way back, and it doubles the data sent." },
      },
      {
        heading: "Check digits",
        body: [
          "A **check digit** is an extra digit at the end of a code, such as a barcode or ISBN, calculated from the other digits. It catches mistakes when the code is typed or scanned, such as a wrong digit or two digits swapped.",
          "For ISBN-13, multiply the digits alternately by 1 and 3, add the results, and pick the check digit that makes the total a multiple of 10. Click a digit below to mistype it.",
        ],
        visualTitle: "ISBN-13 check digit",
        visual: { kind: "checkDigit", digits: "978030640615" },
      },
      {
        heading: "Automatic Repeat reQuest (ARQ)",
        body: [
          "ARQ uses **acknowledgements** and **timeouts**. After receiving a packet, the receiver checks it for errors (for example with a checksum) and sends back a positive acknowledgement if it is fine, or a negative acknowledgement if it is not.",
          "If the sender gets a negative acknowledgement, or nothing at all before the timeout, it sends the packet again.",
        ],
        visual: {
          kind: "flow",
          nodes: [
            { label: "Send packet", detail: "Start the timer." },
            { label: "Receiver checks", detail: "Error-checks the packet." },
            { label: "Acknowledge", detail: "Positive if correct, negative if not." },
            { label: "Resend if needed", detail: "Negative acknowledgement or timeout → send again." },
          ],
        },
      },
    ],
    keyTerms: [
      { term: "Parity bit", definition: "A bit added so the number of 1s is even (even parity) or odd (odd parity)." },
      { term: "Checksum", definition: "A value calculated from a block of data and sent with it, so the receiver can check it." },
      { term: "Echo check", definition: "The receiver sends the data back so the sender can compare it with the original." },
      { term: "Check digit", definition: "A digit calculated from the other digits of a code, used to find data entry errors." },
      { term: "ARQ", definition: "Automatic Repeat reQuest: acknowledgements and timeouts trigger resending." },
    ],
    quiz: [
      { question: "Using even parity, what parity bit is added to `1101001`?", answer: "There are four 1s, already even, so the parity bit is **0**." },
      { question: "Give one limitation of a parity check.", answer: "If an even number of bits are flipped, the count of 1s is still correct, so the error is not detected. It also cannot show which bit is wrong." },
      { question: "What happens in ARQ if the acknowledgement never arrives?", answer: "When the timeout is reached the sender assumes the packet was lost and sends it again." },
      { question: "Is a check digit used to detect transmission errors or data entry errors?", answer: "Data entry errors, such as mistyping or misscanning a code." },
    ],
  },
  {
    slug: "encryption",
    unit: "data-transmission",
    title: "Encryption",
    description: "Why data is encrypted, and how symmetric and asymmetric encryption use keys to keep it secret.",
    updated: "2026-10-31",
    syllabus: "2.3",
    sections: [
      {
        heading: "Why encrypt?",
        body: [
          "Data sent across a network can be intercepted. Encryption does not stop someone from intercepting data, but it makes the data **meaningless** to anyone without the key.",
          "The readable data is **plaintext**. An encryption algorithm and a **key** turn it into scrambled **ciphertext**. Only someone with the right key can turn it back.",
        ],
        visual: {
          kind: "flow",
          nodes: [
            { label: "Plaintext", detail: "`MEET AT 3`" },
            { label: "Encrypt with a key", detail: "Algorithm + key" },
            { label: "Ciphertext", detail: "`X9#q!2Lm@`, safe to send" },
            { label: "Decrypt with a key", detail: "Back to `MEET AT 3`" },
          ],
        },
      },
      {
        heading: "Symmetric encryption",
        body: [
          "Symmetric encryption uses the **same key** to encrypt and decrypt. It is fast, but the key itself has to be shared with the receiver. If the key is intercepted while it is being shared, every message can be read.",
        ],
      },
      {
        heading: "Asymmetric encryption",
        body: [
          "Asymmetric encryption uses a matching **pair of keys**. The **public key** can be given to anyone and is used to encrypt. The **private key** is kept secret by its owner and is the only key that can decrypt.",
          "So if Ben wants to send Asha a message, he encrypts it with Asha's public key. Only Asha's private key can decrypt it, and that key never leaves her computer.",
        ],
        visual: {
          kind: "table",
          columns: ["", "Symmetric", "Asymmetric"],
          rows: [
            ["Keys", "One shared secret key", "Public key and private key"],
            ["Encrypt with", "The secret key", "The receiver's public key"],
            ["Decrypt with", "The same secret key", "The receiver's private key"],
            ["Main problem", "Sharing the key safely", "Slower to encrypt and decrypt"],
          ],
        },
        callout: { tone: "key", text: "Public key encrypts, private key decrypts. The private key is never sent anywhere." },
      },
    ],
    keyTerms: [
      { term: "Plaintext", definition: "Data before it is encrypted." },
      { term: "Ciphertext", definition: "Data after it has been encrypted." },
      { term: "Symmetric encryption", definition: "The same key is used to encrypt and decrypt." },
      { term: "Asymmetric encryption", definition: "A public key encrypts and a matching private key decrypts." },
    ],
    quiz: [
      { question: "Does encryption stop data from being intercepted?", answer: "No. It makes intercepted data unreadable without the key." },
      { question: "What is the main weakness of symmetric encryption?", answer: "The same key must be shared with the receiver, and it could be intercepted while being shared." },
      { question: "Asha wants to receive a secret message. Which key does she share?", answer: "Her **public** key. She keeps her private key secret and uses it to decrypt." },
    ],
  },
];
