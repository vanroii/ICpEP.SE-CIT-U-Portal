"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { FileUp, ShieldCheck, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  facultyAssignOfficerAction,
  importStudentMasterlistAction,
} from "@/app/faculty/actions";
import {
  importMemberMasterlistAction,
  officerAssignMemberAction,
} from "@/app/officer/actions";
import type { MemberMasterlistRow, StudentMasterlistRow } from "@/lib/masterlist";

type ManagerMode = "students" | "members";
type MasterlistRow = StudentMasterlistRow | MemberMasterlistRow;

function normalizeHeader(value: string) {
  const key = value.trim().replace(/^\uFEFF/, "").toLowerCase().replace(/[\s-]+/g, "_");
  const aliases: Record<string, string> = {
    "student_id": "student_number",
    "student_no": "student_number",
    "id_number": "student_number",
    "first": "first_name",
    "middle": "middle_name",
    "last": "last_name",
    "email_address": "email",
    "year": "year_level",
    "member_no": "membership_no",
    "membership_number": "membership_no",
  };
  return aliases[key] || key;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const character = text[i];
    if (quoted) {
      if (character === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"' && cell.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (quoted) throw new Error("The CSV contains an unclosed quoted field.");
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function parseMasterlist(mode: ManagerMode, text: string): MasterlistRow[] {
  const [headerRow, ...dataRows] = parseCsv(text);
  if (!headerRow) throw new Error("The CSV file is empty.");
  const headers = headerRow.map(normalizeHeader);
  const required = mode === "students"
    ? ["student_number", "first_name", "last_name"]
    : ["student_number", "membership_no"];
  const indexes = new Map(headers.map((header, index) => [header, index]));
  const missing = required.filter((header) => !indexes.has(header));

  if (missing.length) {
    throw new Error(`Missing required CSV column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.`);
  }
  if (dataRows.length > 5000) throw new Error("A CSV may contain at most 5,000 rows.");

  const seen = new Set<string>();
  const get = (cells: string[], key: string) => cells[indexes.get(key) ?? -1] || "";
  return dataRows.map((cells, index) => {
    const rowNumber = index + 2;
    const studentNumber = get(cells, "student_number").trim();
    const duplicateKey = studentNumber.toLowerCase();
    if (!studentNumber) throw new Error(`Student number is blank on CSV row ${rowNumber}.`);
    if (seen.has(duplicateKey)) throw new Error(`Duplicate student number on CSV row ${rowNumber}.`);
    seen.add(duplicateKey);

    if (mode === "members") {
      const membershipNo = get(cells, "membership_no").trim();
      if (!membershipNo) throw new Error(`Membership number is blank on CSV row ${rowNumber}.`);
      return { student_number: studentNumber, membership_no: membershipNo };
    }

    const firstName = get(cells, "first_name").trim();
    const lastName = get(cells, "last_name").trim();
    const yearText = get(cells, "year_level").trim();
    const yearLevel = yearText ? Number(yearText) : null;
    if (!firstName || !lastName) {
      throw new Error(`First and last names are required on CSV row ${rowNumber}.`);
    }
    if (yearLevel !== null && (!Number.isInteger(yearLevel) || yearLevel < 1 || yearLevel > 6)) {
      throw new Error(`Year level must be from 1 to 6 on CSV row ${rowNumber}.`);
    }
    const email = get(cells, "email").trim();
    return {
      student_number: studentNumber,
      first_name: firstName,
      middle_name: get(cells, "middle_name").trim() || null,
      last_name: lastName,
      email: email || null,
      program: get(cells, "program").trim() || null,
      year_level: yearLevel,
    };
  });
}

export function RoleMasterlistManager({ mode }: { mode: ManagerMode }) {
  const isStudentList = mode === "students";
  const [studentNumber, setStudentNumber] = useState("");
  const [membershipNumber, setMembershipNumber] = useState("");
  const [fileRows, setFileRows] = useState<MasterlistRow[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileRows(null);
    setFileName("");
    setMessage("");
    setError("");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Choose a .CSV file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("CSV files must be 5 MB or smaller.");
      return;
    }
    try {
      const rows = parseMasterlist(mode, await file.text());
      if (rows.length === 0) throw new Error("The CSV has headers but no student rows.");
      setFileRows(rows);
      setFileName(file.name);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not read the CSV file.");
    }
  };

  const handleAssignment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = isStudentList
        ? await facultyAssignOfficerAction(studentNumber)
        : await officerAssignMemberAction(studentNumber, membershipNumber);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage(isStudentList ? "Officer role assigned." : "Member role assigned.");
        setStudentNumber("");
        setMembershipNumber("");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not assign the role.");
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    if (!fileRows) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = isStudentList
        ? await importStudentMasterlistAction(fileRows as StudentMasterlistRow[])
        : await importMemberMasterlistAction(fileRows as MemberMasterlistRow[]);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage(
          isStudentList
            ? `Imported ${result.imported} students; updated ${result.matched} registered accounts.`
            : `Added ${result.imported} memberships for registered students.`,
        );
        setFileRows(null);
        setFileName("");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not import the CSV file.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-4 rounded-[16px] border border-[#DEDBD8] bg-white p-6 shadow-xs">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0087B5]" />
          <div>
            <h2 className="font-bold text-[#1C1713]">
              Assign a {isStudentList ? "Student as Officer" : "Student as Member"}
            </h2>
            <p className="mt-1 text-xs text-[#817B77]">
              {isStudentList
                ? "Promote an existing student account using their student number."
                : "Assign an active membership to an existing student account."}
            </p>
          </div>
        </div>
        <form onSubmit={handleAssignment} className="flex flex-col gap-3">
          <label className="sr-only" htmlFor={`${mode}-student-number`}>Student number</label>
          <input
            id={`${mode}-student-number`}
            required
            value={studentNumber}
            onChange={(event) => setStudentNumber(event.target.value)}
            placeholder="Student number"
            className="min-w-0 rounded-lg border border-[#DEDBD8] px-3 py-2 text-sm text-[#1C1713] outline-none focus:border-[#0087B5]"
          />
          {!isStudentList && (
            <>
              <label className="sr-only" htmlFor="member-membership-number">Membership number</label>
              <input
                id="member-membership-number"
                required
                value={membershipNumber}
                onChange={(event) => setMembershipNumber(event.target.value)}
                placeholder="Membership number"
                className="min-w-0 rounded-lg border border-[#DEDBD8] px-3 py-2 text-sm text-[#1C1713] outline-none focus:border-[#0087B5]"
              />
            </>
          )}
          <div>
            <Button type="submit" isLoading={busy} size="sm">
              <UserRoundPlus className="mr-2 h-4 w-4" />
              Assign {isStudentList ? "Officer" : "Member"}
            </Button>
          </div>
        </form>
      </div>

      <div className="space-y-4 rounded-[16px] border border-[#DEDBD8] bg-white p-6 shadow-xs">
        <div className="flex items-start gap-3">
          <FileUp className="mt-0.5 h-5 w-5 shrink-0 text-[#0087B5]" />
          <div>
            <h2 className="font-bold text-[#1C1713]">
              Upload {isStudentList ? "Student" : "Member"} Masterlist
            </h2>
            <p className="mt-1 text-xs text-[#817B77]">
              {isStudentList
                ? "Required columns: student_number, first_name, last_name. Optional: middle_name, email, program, year_level."
                : "Required columns: student_number, membership_no. Every student must already have an account."}
            </p>
          </div>
        </div>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          aria-label={`Upload ${isStudentList ? "student" : "member"} masterlist CSV`}
          className="block w-full text-sm text-[#514B47] file:mr-3 file:rounded-lg file:border-0 file:bg-[#E3F6FC] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#0087B5]"
        />
        {fileRows && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <p className="text-[#514B47]">{fileName} · {fileRows.length} rows ready</p>
            <Button type="button" onClick={handleImport} isLoading={busy} size="sm">
              Import CSV
            </Button>
          </div>
        )}
        {message && <p role="status" className="text-xs font-medium text-green-700">{message}</p>}
        {error && <p role="alert" className="text-xs font-medium text-red-700">{error}</p>}
      </div>
    </section>
  );
}
