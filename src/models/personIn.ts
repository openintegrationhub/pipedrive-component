import { Visibility } from './enums';

export interface PersonIn {
    person_name: string;
    owner_id: number;
    org_id: number;
    person_email: Array<string>;
    person_phone: Array<string>;
    visible_to: Visibility;
    add_time: string;
}
