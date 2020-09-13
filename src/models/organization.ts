import { Visibility } from "./enums";

export interface Organization {
  name: string;
  visible_to: Visibility;
}
