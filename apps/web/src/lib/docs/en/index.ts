import type { Doc } from "../types";
import { algorithmsEn } from "./algorithms";
import { booleanLogicEn } from "./boolean-logic";
import { dataRepresentationEn } from "./data-representation";
import { dataTransmissionEn } from "./data-transmission";
import { databasesEn } from "./databases";
import { emergingTechEn } from "./emerging-tech";
import { hardwareEn } from "./hardware";
import { internetEn } from "./internet";
import { programmingEn } from "./programming";
import { pseudoeditorEn } from "./pseudoeditor";
import { softwareEn } from "./software";

export const docsEn: Doc[] = [
  ...dataRepresentationEn,
  ...dataTransmissionEn,
  ...hardwareEn,
  ...softwareEn,
  ...internetEn,
  ...emergingTechEn,
  ...algorithmsEn,
  ...programmingEn,
  ...databasesEn,
  ...booleanLogicEn,
  ...pseudoeditorEn,
];
