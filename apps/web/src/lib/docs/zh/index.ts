import type { Doc } from "../types";
import { algorithmsZh } from "./algorithms";
import { booleanLogicZh } from "./boolean-logic";
import { dataRepresentationZh } from "./data-representation";
import { dataTransmissionZh } from "./data-transmission";
import { databasesZh } from "./databases";
import { emergingTechZh } from "./emerging-tech";
import { hardwareZh } from "./hardware";
import { internetZh } from "./internet";
import { programmingZh } from "./programming";
import { pseudoeditorZh } from "./pseudoeditor";
import { softwareZh } from "./software";

export const docsZh: Doc[] = [
  ...dataRepresentationZh,
  ...dataTransmissionZh,
  ...hardwareZh,
  ...softwareZh,
  ...internetZh,
  ...emergingTechZh,
  ...algorithmsZh,
  ...programmingZh,
  ...databasesZh,
  ...booleanLogicZh,
  ...pseudoeditorZh,
];
