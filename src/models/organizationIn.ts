import { Visibility } from './enums';

export interface OrganizationIn {
    org_name: string;
    owner_id: number;
    org_visible_to: Visibility;
    org_add_time: string;
}
