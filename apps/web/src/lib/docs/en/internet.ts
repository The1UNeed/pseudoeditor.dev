import type { Doc } from "../types";

export const internetEn: Doc[] = [
  {
    slug: "internet-and-web",
    unit: "internet",
    title: "The internet and the World Wide Web",
    description: "The difference between the internet and the web, URLs, HTTP and HTTPS, how a browser finds a page with DNS, cookies, and digital currency.",
    updated: "2026-10-31",
    syllabus: "5.1, 5.2",
    sections: [
      {
        heading: "Internet versus World Wide Web",
        body: [
          "The **internet** is the infrastructure: a huge global network of connected computers, cables, and routers.",
          "The **World Wide Web** is a collection of web pages and other resources that you reach **using** the internet. Email, online games, and video calls also use the internet but are not part of the web.",
        ],
      },
      {
        heading: "Parts of a URL",
        body: ["A **uniform resource locator (URL)** is a text address for a web page. It has three main parts:"],
        visual: {
          kind: "segments",
          segments: [
            { label: "https://", detail: "**Protocol**: the rules used to transfer the page." },
            { label: "www.pseudoeditor.dev", detail: "**Domain name**: the website's server.", weight: 2 },
            { label: "/docs/loops", detail: "**File name / path**: the page on that server.", weight: 1.3 },
          ],
        },
      },
      {
        heading: "HTTP and HTTPS",
        body: [
          "**HTTP** (hypertext transfer protocol) is the set of rules for sending web pages between a server and a browser.",
          "**HTTPS** is HTTP made secure with **SSL/TLS**. The data is encrypted, and the server proves its identity with a **digital certificate**, so data such as passwords and card numbers cannot be read if intercepted. Browsers show a padlock for HTTPS sites.",
        ],
      },
      {
        heading: "What a web browser does",
        body: ["A browser is application software that requests and displays web pages. It:"],
        bullets: [
          "renders HTML into the page you see",
          "stores bookmarks, favourites, and history",
          "lets you open several pages in tabs",
          "stores cookies",
          "provides navigation: back, forward, refresh, and an address bar",
        ],
      },
      {
        heading: "How a page reaches your screen",
        body: [
          "Computers find each other by IP address, but people type domain names. The **Domain Name System (DNS)** translates one into the other.",
        ],
        visualTitle: "From URL to page",
        visual: {
          kind: "flow",
          nodes: [
            { label: "Type the URL", detail: "The browser needs the IP address for the domain name." },
            { label: "Ask a DNS server", detail: "The browser sends the domain name to a DNS server." },
            { label: "Find the IP address", detail: "If that DNS server does not know it, it asks other DNS servers." },
            { label: "Return the IP address", detail: "The IP address is sent back to the browser." },
            { label: "Request the page", detail: "The browser sends a request to the web server at that IP address." },
            { label: "Render the page", detail: "The server sends the HTML back and the browser displays it." },
          ],
        },
      },
      {
        heading: "Cookies",
        body: [
          "A **cookie** is a small text file that a website stores on your computer through the browser. It lets the website remember you.",
        ],
        visual: {
          kind: "table",
          columns: ["", "Session cookie", "Persistent cookie"],
          rows: [
            ["Stored", "In memory, only while the browser is open", "On the device, until it expires or is deleted"],
            ["Used for", "Keeping items in a shopping basket as you browse", "Remembering logins, language, and preferences; tracking for adverts"],
          ],
        },
      },
      {
        heading: "Digital currency and blockchain",
        body: [
          "A **digital currency** exists only electronically. Cryptocurrencies such as Bitcoin are not controlled by a bank or government. Instead, every transaction is recorded on a **blockchain**.",
          "A blockchain is a digital ledger shared across many computers. Each block holds transactions plus a hash of the previous block, chaining them together. Changing an old block would break every block after it, and every copy of the ledger would disagree, so tampering is easy to spot.",
        ],
      },
    ],
    keyTerms: [
      { term: "Internet", definition: "A global network of interconnected computer networks." },
      { term: "World Wide Web", definition: "A collection of websites and web pages accessed using the internet." },
      { term: "URL", definition: "A text address that identifies a web page." },
      { term: "DNS", definition: "Domain Name System: translates domain names into IP addresses." },
      { term: "Cookie", definition: "A small file stored by a website on a user's device to remember information." },
      { term: "Blockchain", definition: "A shared digital ledger of transactions where each block links to the previous one." },
    ],
    quiz: [
      { question: "Explain the difference between the internet and the World Wide Web.", answer: "The internet is the global network infrastructure. The web is the collection of web pages accessed using it." },
      { question: "Identify the protocol and domain name in `https://www.example.com/news/today`.", answer: "Protocol: `https`. Domain name: `www.example.com`." },
      { question: "What does a DNS server do?", answer: "It looks up the IP address that matches a domain name and returns it to the browser." },
      { question: "Why does HTTPS protect a password typed into a website?", answer: "The data is encrypted with SSL/TLS, so if it is intercepted it cannot be understood." },
    ],
  },
  {
    slug: "cyber-security",
    unit: "internet",
    title: "Cyber security threats and solutions",
    description: "Brute force, interception, DDoS, hacking, malware, phishing, pharming, and social engineering, and the ways to defend against them.",
    updated: "2026-10-31",
    syllabus: "5.3",
    sections: [
      {
        heading: "Threats",
        body: ["Cyber security means protecting systems and data from attack. These are the threats you need to know:"],
        visual: {
          kind: "table",
          columns: ["Threat", "What happens", "Aim"],
          rows: [
            ["Brute-force attack", "Software tries every possible password until one works", "Get into an account"],
            ["Data interception", "Data is captured as it travels across a network, for example with a packet sniffer", "Steal data"],
            ["DDoS attack", "Many infected computers (a botnet) flood a server with requests so it cannot respond", "Take a website offline"],
            ["Hacking", "Gaining unauthorised access to a computer system", "Steal, change, or delete data"],
            ["Malware", "Malicious software: see below", "Damage, steal, or extort"],
            ["Phishing", "A fake email or message tricks you into clicking a link and entering personal details", "Steal details"],
            ["Pharming", "Malicious code redirects you from a real website to a fake one, even if you type the correct URL", "Steal details"],
            ["Social engineering", "Manipulating people into giving away information or access, such as pretending to be IT support", "Get past security by tricking people"],
          ],
        },
      },
      {
        heading: "Types of malware",
        visual: {
          kind: "table",
          columns: ["Malware", "Behaviour"],
          rows: [
            ["Virus", "Attaches to a file and replicates when the file is run, spreading to other files"],
            ["Worm", "Replicates and spreads across a network by itself, without a host file"],
            ["Trojan horse", "Pretends to be useful software but carries hidden malicious code"],
            ["Spyware", "Secretly records what you do and sends it to a third party"],
            ["Adware", "Shows unwanted adverts, often redirecting your browser"],
            ["Ransomware", "Encrypts your files and demands payment for the key"],
          ],
        },
        body: [],
      },
      {
        heading: "Solutions",
        body: ["No single measure stops everything, so systems use several layers of protection:"],
        visual: {
          kind: "table",
          columns: ["Solution", "How it helps"],
          rows: [
            ["Access levels", "Users can only see and change the data they need"],
            ["Anti-malware", "Scans files for known malware, quarantines and deletes it"],
            ["Authentication", "Strong passwords, biometrics (fingerprint, face), and two-step verification (a code sent to your phone)"],
            ["Automating software updates", "Fixes security weaknesses as soon as patches are released"],
            ["Checking emails and URLs", "Spelling mistakes, odd tone, or a slightly wrong web address are signs of phishing"],
            ["Firewall", "Monitors traffic in and out of a network and blocks anything that breaks its rules"],
            ["Privacy settings", "Control who can see your information online"],
            ["Proxy server", "Sits between users and the internet, hiding their IP addresses and filtering traffic"],
            ["SSL / TLS", "Encrypts data between a browser and a server"],
          ],
        },
        callout: { tone: "tip", text: "Exam questions often describe a scenario. Name the threat, explain what it does in that scenario, then give a matching solution." },
      },
    ],
    keyTerms: [
      { term: "Malware", definition: "Software designed to harm a computer system or its users." },
      { term: "Phishing", definition: "Fraudulent messages that trick people into revealing personal information." },
      { term: "Pharming", definition: "Redirecting users from a genuine website to a fake one." },
      { term: "Firewall", definition: "Hardware or software that monitors and filters network traffic." },
      { term: "Two-step verification", definition: "Authentication that needs a second step, such as a code sent to a phone." },
    ],
    quiz: [
      { question: "What is the difference between phishing and pharming?", answer: "Phishing tricks you into clicking a link in a fake message. Pharming redirects you to a fake site even when you type the real address, using malicious code." },
      { question: "How does a DDoS attack stop a website working?", answer: "A botnet sends so many requests that the server cannot cope and cannot respond to genuine users." },
      { question: "Give two ways to reduce the risk of a brute-force attack.", answer: "Use long, complex passwords; lock the account after a number of failed attempts; use two-step verification." },
    ],
  },
];
