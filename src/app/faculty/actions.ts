"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { StudentMasterlistRow } from "@/lib/masterlist";

export async function facultyAssignOfficerAction(studentNumber: string) {
  const cleanedStudentNumber = studentNumber.trim();
  if (!cleanedStudentNumber) return { error: "Student number is required." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("faculty_assign_officer", {
    p_student_number: cleanedStudentNumber,
  });

  if (error) return { error: error.message };

  revalidatePath("/faculty");
  revalidatePath("/officer");
  revalidatePath("/admin");
  return { success: true };
}

export async function importStudentMasterlistAction(rows: StudentMasterlistRow[]) {
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 5000) {
    return { error: "Upload between 1 and 5,000 student rows." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("import_student_masterlist", {
    p_rows: rows,
  });

  if (error) return { error: error.message };

  revalidatePath("/faculty");
  revalidatePath("/officer");
  revalidatePath("/admin");
  return {
    success: true,
    imported: data.imported as number,
    matched: data.matched as number,
  };
}
