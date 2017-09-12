import { Done } from './enums';

export class ActivityIn {
    activity_subject: string;
    activity_done: Done;
    activity_type: string;
    deal_id: number;
    person_id: number;
    org_id: number;
    user_id: number;
}
