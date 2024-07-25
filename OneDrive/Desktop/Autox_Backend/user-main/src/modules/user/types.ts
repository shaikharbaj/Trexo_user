export interface CreateAdminUserBody {
  name: string;
  email_id: string;
  position: string;
  reporting_to: string;
  role_ids: any;
}

export interface ToggleAdminUserVisibilityBody {
  is_active: boolean | string;
}

export interface UpdateAdminUserBody {
  name: string;
  email_id: string;
  position: string;
  reporting_to: string;
  role_ids: any;
}
