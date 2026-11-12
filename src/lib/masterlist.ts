export interface StudentMasterlistRow {
  student_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string | null;
  program: string | null;
  year_level: number | null;
}

export interface MemberMasterlistRow {
  student_number: string;
  membership_no: string;
}
