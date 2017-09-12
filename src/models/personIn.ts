import { Visibility } from './enums';

export interface PersonIn {
    person_name: string;
    owner_id: number;
    org_id: number;
    person_email: Array<string>;
    person_phone: Array<string>;
    person_visible_to: Visibility;
    person_add_time: string;
}
