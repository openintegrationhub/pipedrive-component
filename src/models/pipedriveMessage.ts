import { Visibility } from "../models/enums";

// owner_id and user_id are fully optional
//  when owner_id not specified authenticated user is set as owner
// from https://developers.pipedrive.com/docs/api/v1
// If user_id is defined, it will replace owner_id for task
export interface PipedriveMessage {
    activity_id: number;
    activity_subject: string;
    user_id: number;
    deal_id: number;
    person_id: number;
    org_id: number;
    activity_note: string;
    owner_id: number;
    deal_title: string;
    deal_value: string;
    deal_currency: string;
    add_time: string;
    visible_to: Visibility;
    note_id: number;
    note_content: string;
    org_name: string;
    person_name: string;
    person_email: string;
    person_phone: string;
}