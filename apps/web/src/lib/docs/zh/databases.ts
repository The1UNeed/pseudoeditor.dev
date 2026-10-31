import type { Doc } from "../types";
import { petsTable } from "../en/databases";

const { columns, rows } = petsTable;

export const databasesZh: Doc[] = [
  {
    slug: "databases-and-sql",
    unit: "databases",
    title: "数据库与 SQL",
    description: "表、记录、字段、数据类型和主键，以及如何用 SQL 查询单表数据库。",
    updated: "2026-10-31",
    syllabus: "9.1",
    sections: [
      {
        heading: "表、记录与字段",
        body: [
          "**数据库**是一种结构化的数据存储方式，便于查找、排序和更新。单表数据库把所有数据存放在一张**表**中。",
          "每一行是一条**记录**：关于一个对象的全部数据（这里是一只宠物）。每一列是一个**字段**：每条记录都存有的一项数据（这里是宠物的名字、种类等）。",
        ],
        visualTitle: "表：Pets",
        visual: { kind: "table", columns, rows },
        caption: "6 条记录，每条有 5 个字段。",
      },
      {
        heading: "字段的数据类型",
        body: ["每个字段都会被指定一种数据类型，这同时也起到验证的作用："],
        visual: {
          kind: "table",
          columns: ["数据类型", "存放", "示例字段"],
          rows: [
            ["文本 / 字母数字", "字母、数字和符号", "Name、PetID、电话号码"],
            ["字符", "单个字符", "尺码：S、M 或 L"],
            ["布尔", "真 / 假（是 / 否）", "Vaccinated（是否接种疫苗）"],
            ["整数", "整数", "Age"],
            ["实数", "带小数的数", "体重（千克）"],
            ["日期 / 时间", "日期或时间", "DateOfBirth"],
          ],
        },
      },
      {
        heading: "主键",
        body: [
          "**主键**是为每条记录保存**唯一**值的字段，用来识别每条记录。名字不适合作为主键，因为两只宠物可能同名；`PetID` 则是唯一的。",
        ],
        callout: { tone: "key", text: "任何两条记录的主键值都不能相同，而且主键永远不能为空。" },
      },
      {
        heading: "SELECT、FROM、WHERE、ORDER BY",
        body: [
          "**SQL**（结构化查询语言）用来查询数据库。一条查询指明要显示的字段（`SELECT`）、表（`FROM`）、记录必须满足的条件（`WHERE`），以及结果的排序方式（`ORDER BY ... ASC` 或 `DESC`）。",
          "在图中，变淡的行不满足 `WHERE` 条件，高亮的列就是被选中的字段。",
        ],
        visualTitle: "狗，按年龄从大到小",
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
        heading: "组合条件",
        body: ["用 `AND` 和 `OR` 构造更具体的条件，再配合 `<`、`>` 和 `<>`（不等于）等比较运算符。"],
        visualTitle: "不是狗的年幼宠物",
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
        heading: "SUM 与 COUNT",
        body: ["`COUNT` 返回符合条件的记录数。`SUM` 把符合条件的记录中某个数值字段的值加起来。"],
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
      { term: "记录", definition: "表中的一行：关于一个对象的全部数据。" },
      { term: "字段", definition: "表中的一列：一类数据。" },
      { term: "主键", definition: "唯一标识每条记录的字段。" },
      { term: "SQL", definition: "结构化查询语言，用于查询数据库。" },
    ],
    quiz: [
      { question: "Pets 表有多少条记录、多少个字段？", answer: "**6 条记录**，**5 个字段**。" },
      { question: "为什么 `Owner` 不适合作为主键？", answer: "它不唯一：Chen 有两只宠物。" },
      { question: "写一条查询：显示每只猫的 PetID，年龄小的排在前面。", answer: "`SELECT PetID FROM Pets WHERE Type = 'Cat' ORDER BY Age ASC;`" },
      { question: "`SELECT COUNT(PetID) FROM Pets WHERE Age > 3;` 返回什么？", answer: "**3**（Milo 5 岁、Max 7 岁、Rocky 4 岁）。" },
    ],
  },
];
