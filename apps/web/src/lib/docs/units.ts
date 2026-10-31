import type { Locale } from "@/i18n/config";
import type { Unit, UnitId } from "./types";

/* Topic numbers follow the Cambridge IGCSE Computer Science (0478) syllabus. */
const unitShape: Array<Pick<Unit, "id" | "number" | "paper">> = [
  { id: "data-representation", number: 1, paper: 1 },
  { id: "data-transmission", number: 2, paper: 1 },
  { id: "hardware", number: 3, paper: 1 },
  { id: "software", number: 4, paper: 1 },
  { id: "internet", number: 5, paper: 1 },
  { id: "emerging-tech", number: 6, paper: 1 },
  { id: "algorithms", number: 7, paper: 2 },
  { id: "programming", number: 8, paper: 2 },
  { id: "databases", number: 9, paper: 2 },
  { id: "boolean-logic", number: 10, paper: 2 },
  { id: "pseudoeditor", number: null, paper: null },
];

const unitText: Record<Locale, Record<UnitId, { title: string; summary: string }>> = {
  en: {
    "data-representation": {
      title: "Data representation",
      summary: "Binary, hexadecimal, and how text, sound, and images become numbers.",
    },
    "data-transmission": {
      title: "Data transmission",
      summary: "Packets, cables, catching errors on the way, and keeping data secret.",
    },
    hardware: {
      title: "Hardware",
      summary: "The CPU and its cycle, input and output devices, storage, and network hardware.",
    },
    software: {
      title: "Software",
      summary: "What an operating system does, interrupts, and how code is translated.",
    },
    internet: {
      title: "The internet and its uses",
      summary: "How a web page reaches you, cookies, digital currency, and staying safe online.",
    },
    "emerging-tech": {
      title: "Automated and emerging technologies",
      summary: "Sensors and actuators, robots, and artificial intelligence.",
    },
    algorithms: {
      title: "Algorithm design and problem-solving",
      summary: "Plan with flowcharts, use the standard algorithms, validate, test, and trace.",
    },
    programming: {
      title: "Programming",
      summary: "Variables, selection, loops, strings, subroutines, arrays, and files.",
    },
    databases: {
      title: "Databases",
      summary: "Tables, records, fields, primary keys, and SQL queries.",
    },
    "boolean-logic": {
      title: "Boolean logic",
      summary: "Logic gates, truth tables, and building circuits from expressions.",
    },
    pseudoeditor: {
      title: "Using PseudoEditor",
      summary: "Write, run, debug, and save your programs in the browser editor.",
    },
  },
  zh: {
    "data-representation": {
      title: "数据表示",
      summary: "二进制、十六进制，以及文字、声音和图像如何变成数字。",
    },
    "data-transmission": {
      title: "数据传输",
      summary: "数据包、传输方式、途中如何发现错误，以及如何为数据保密。",
    },
    hardware: {
      title: "硬件",
      summary: "CPU 与它的工作周期、输入输出设备、存储器和网络硬件。",
    },
    software: {
      title: "软件",
      summary: "操作系统做什么、中断，以及代码如何被翻译。",
    },
    internet: {
      title: "互联网及其应用",
      summary: "网页如何到达你的屏幕、Cookie、数字货币，以及网络安全。",
    },
    "emerging-tech": {
      title: "自动化与新兴技术",
      summary: "传感器与执行器、机器人，以及人工智能。",
    },
    algorithms: {
      title: "算法设计与问题解决",
      summary: "用流程图规划，掌握标准算法，做好验证、测试与追踪。",
    },
    programming: {
      title: "编程",
      summary: "变量、选择、循环、字符串、子程序、数组和文件。",
    },
    databases: {
      title: "数据库",
      summary: "表、记录、字段、主键和 SQL 查询。",
    },
    "boolean-logic": {
      title: "布尔逻辑",
      summary: "逻辑门、真值表，以及根据表达式搭建电路。",
    },
    pseudoeditor: {
      title: "使用 PseudoEditor",
      summary: "在浏览器编辑器中编写、运行、调试和保存程序。",
    },
  },
};

export const unitIds = unitShape.map((unit) => unit.id);

export function getUnits(locale: Locale): Unit[] {
  return unitShape.map((unit) => ({ ...unit, ...unitText[locale][unit.id] }));
}

export function getUnit(locale: Locale, id: UnitId): Unit {
  return getUnits(locale).find((unit) => unit.id === id)!;
}
