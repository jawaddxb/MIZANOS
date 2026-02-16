export interface OrgChartNode {
  id: string;
  full_name: string | null;
  email: string | null;
  title: string | null;
  roles: string[];
  avatar_url: string | null;
  office_location: string | null;
  status: string | null;
  reports_to: string | null;
}

export interface UpdateReportingLineRequest {
  manager_id: string | null;
}
