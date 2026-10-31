import type { Doc } from "../types";

const columns = ["PetID", "Name", "Type", "Age", "Owner"];
const rows = [
  ["P01", "Bella", "Dog", "3", "Khan"],
  ["P02", "Milo", "Cat", "5", "Chen"],
  ["P03", "Coco", "Rabbit", "1", "Okafor"],
  ["P04", "Max", "Dog", "7", "Silva"],
  ["P05", "Luna", "Cat", "2", "Patel"],
  ["P06", "Rocky", "Dog", "4", "Chen"],
];

export const petsTable = { columns, rows };

export const databasesEn: Doc[] = [
  {
    slug: "databases-and-sql",
    unit: "databases",
    title: "Databases and SQL",
    description: "Tables, records, fields, data types, and primary keys, and how to query a single-table database with SQL.",
    updated: "2026-10-31",
    syllabus: "9.1",
    sections: [
      {
        heading: "Tables, records, and fields",
        body: [
          "A **database** is a structured way to store data so it can be searched, sorted, and updated easily. A single-table database stores everything in one **table**.",
          "Each row is a **record**: all the data about one thing (here, one pet). Each column is a **field**: one piece of data stored for every record (here, the pet's name, type, and so on).",
        ],
        visualTitle: "Table: Pets",
        visual: { kind: "table", columns, rows },
        caption: "6 records, each with 5 fields.",
      },
      {
        heading: "Data types for fields",
        body: ["Each field is given a data type, which also works as validation:"],
        visual: {
          kind: "table",
          columns: ["Data type", "Holds", "Example field"],
          rows: [
            ["Text / alphanumeric", "Letters, digits, and symbols", "Name, PetID, phone number"],
            ["Character", "A single character", "Size: S, M, or L"],
            ["Boolean", "True / false (yes / no)", "Vaccinated"],
            ["Integer", "Whole numbers", "Age"],
            ["Real", "Numbers with decimals", "Weight in kg"],
            ["Date / time", "A date or time", "DateOfBirth"],
          ],
        },
      },
      {
        heading: "Primary keys",
        body: [
          "A **primary key** is a field that holds a **unique** value for every record, so each record can be identified. Names are not good keys because two pets could share a name; `PetID` is unique.",
        ],
        callout: { tone: "key", text: "No two records can have the same primary key value, and it can never be empty." },
      },
      {
        heading: "SELECT, FROM, WHERE, ORDER BY",
        body: [
          "**SQL** (Structured Query Language) is used to search a database. A query names the fields to show (`SELECT`), the table (`FROM`), the condition records must meet (`WHERE`), and how to sort the results (`ORDER BY ... ASC` or `DESC`).",
          "In the diagram, the faded rows fail the `WHERE` condition and the highlighted columns are the ones selected.",
        ],
        visualTitle: "Dogs, oldest first",
        visual: {
          kind: "sql",
          query: "SELECT Name, Age\nFROM Pets\nWHERE Type = 'Dog'\nORDER BY Age DESC;",
          table: "Pets",
          columns,
          rows,
          matches: [3, 5, 0],
          selected: ["Name", "Age"],
        },
      },
      {
        heading: "Combining conditions",
        body: ["Use `AND` and `OR` to build more specific conditions, and comparison operators such as `<`, `>`, and `<>` (not equal)."],
        visualTitle: "Young pets that are not dogs",
        visual: {
          kind: "sql",
          query: "SELECT Name, Owner\nFROM Pets\nWHERE Age < 4 AND Type <> 'Dog';",
          table: "Pets",
          columns,
          rows,
          matches: [2, 4],
          selected: ["Name", "Owner"],
        },
      },
      {
        heading: "SUM and COUNT",
        body: [
          "`COUNT` returns how many records match. `SUM` adds up the values in a numeric field for the matching records.",
        ],
        example: `SELECT COUNT(PetID)
FROM Pets
WHERE Type = 'Cat';
-- Result: 2

SELECT SUM(Age)
FROM Pets
WHERE Owner = 'Chen';
-- Result: 9 (Milo 5 + Rocky 4)`,
        exampleLanguage: "sql",
      },
    ],
    keyTerms: [
      { term: "Record", definition: "A row in a table: all the data about one item." },
      { term: "Field", definition: "A column in a table: one category of data." },
      { term: "Primary key", definition: "A field that uniquely identifies each record." },
      { term: "SQL", definition: "Structured Query Language, used to query databases." },
    ],
    quiz: [
      { question: "How many records and fields does the Pets table have?", answer: "**6 records** and **5 fields**." },
      { question: "Why is `Owner` not a suitable primary key?", answer: "It is not unique: Chen owns two pets." },
      { question: "Write a query to show the PetID of every cat, youngest first.", answer: "`SELECT PetID FROM Pets WHERE Type = 'Cat' ORDER BY Age ASC;`" },
      { question: "What does `SELECT COUNT(PetID) FROM Pets WHERE Age > 3;` return?", answer: "**3** (Milo 5, Max 7, Rocky 4)." },
    ],
  },
];
