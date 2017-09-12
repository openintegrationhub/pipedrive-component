import { Status, Visibility } from './enums';

export interface DealIn {
    deal_title: string;
    deal_value: number;
    deal_currency: string;
    user_id: number;
    person_id: number;
    org_id: number;
    deal_stage_id: number;
    deal_status: Status;
    deal_lost_reason: string;
    deal_visible_to: Visibility;
    deal_add_time: string;
}
