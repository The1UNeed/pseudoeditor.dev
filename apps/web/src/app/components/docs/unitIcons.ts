import { Binary, Bot, Cable, CircuitBoard, Code, Cpu, Database, Globe, Layers, SquareTerminal, Workflow, type LucideIcon } from "lucide-react";
import type { UnitId } from "@/lib/docs/types";

export const unitIcons: Record<UnitId, LucideIcon> = {
  "data-representation": Binary,
  "data-transmission": Cable,
  hardware: Cpu,
  software: Layers,
  internet: Globe,
  "emerging-tech": Bot,
  algorithms: Workflow,
  programming: Code,
  databases: Database,
  "boolean-logic": CircuitBoard,
  pseudoeditor: SquareTerminal,
};
