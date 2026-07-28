import { supabase } from "../lib/supabase";

/* =========================================
   HELPERS
========================================= */

export async function generateEmployeeId() {
  const { data, error } = await supabase
    .from("employees")
    .select("employee_id");

  if (error) {
    console.error(error);
    return "EMP-001";
  }

  const max = (data || []).reduce((highest, row) => {
    const match = /^EMP-(\d+)$/i.exec(row.employee_id || "");

    if (!match) return highest;

    return Math.max(highest, Number(match[1]));
  }, 0);

  return `EMP-${String(max + 1).padStart(3, "0")}`;
}

export function generateAccessCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

export function formatEmployeeId(employeeId, id) {
  if (employeeId) return employeeId;

  if (!id) return "N/A";

  return "EMP-" + String(id).slice(-4).toUpperCase();
}

export function normalizePhone(phone = "") {
  return phone.trim();
}

export function isValidPhone(phone) {
  return /^(\+63|0)\d{10}$/.test(phone);
}

export function formatDate(date) {
  if (!date) return null;

  return new Date(date).toISOString().split("T")[0];
}

/* =========================================
   GET EMPLOYEES
========================================= */

export async function getEmployees() {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) throw error;

  return data || [];
}

/* =========================================
   GET EMPLOYEE
========================================= */

export async function getEmployee(id) {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

/* =========================================
   ADD EMPLOYEE
========================================= */

export async function createEmployee(employee) {

  const employeeId = await generateEmployeeId();

  const payload = {

    employee_id: employeeId,

    name: employee.name,

    birthdate: formatDate(employee.birthdate),

    gender: employee.gender,

    civil_status: employee.civil_status,

    phone: normalizePhone(employee.phone),

    email: employee.email,

    emergency_contact_name:
      employee.emergency_contact_name,

    emergency_contact_number:
      normalizePhone(
        employee.emergency_contact_number
      ),

    street: employee.street,

    barangay: employee.barangay,

    city: employee.city,

    province: employee.province,

    role: employee.role.toLowerCase(),

    status: "available",

    license_number:
      employee.license_number,

    access_code:
      employee.access_code ||
      generateAccessCode(),

    code_status:
      employee.code_status ||
      "Activated",

    date_hired:
      formatDate(employee.date_hired),

  };

  const { error } =
    await supabase
      .from("employees")
      .insert(payload);

  if (error) throw error;
}

/* =========================================
   UPDATE EMPLOYEE
========================================= */

export async function updateEmployee(id, employee) {

  const payload = {

    name: employee.name,

    birthdate:
      formatDate(employee.birthdate),

    gender:
      employee.gender,

    civil_status:
      employee.civil_status,

    phone:
      normalizePhone(employee.phone),

    email:
      employee.email,

    emergency_contact_name:
      employee.emergency_contact_name,

    emergency_contact_number:
      normalizePhone(
        employee.emergency_contact_number
      ),

    street:
      employee.street,

    barangay:
      employee.barangay,

    city:
      employee.city,

    province:
      employee.province,

    role:
      employee.role.toLowerCase(),

    status:
      employee.status.toLowerCase(),

    date_hired:
      formatDate(employee.date_hired),

    license_number:
      employee.license_number,

    access_code:
      employee.access_code,

    code_status:
      employee.code_status,
  };

  const { error } =
    await supabase
      .from("employees")
      .update(payload)
      .eq("id", id);

  if (error) throw error;
}

/* =========================================
   DELETE EMPLOYEE
========================================= */

export async function deleteEmployee(id) {

  const { error } =
    await supabase
      .from("employees")
      .delete()
      .eq("id", id);

  if (error) throw error;
}

/* =========================================
   EMPLOYEE STATISTICS
========================================= */

export function getEmployeeStats(employees = []) {

  return {

    totalEmployees:
      employees.length,

    drivers:
      employees.filter(
        e =>
          e.role === "driver" &&
          ["active","available"]
          .includes(
            e.status
          )
      ).length,

    staff:
      employees.filter(
        e =>
          ["staff","admin"]
          .includes(e.role) &&
          ["active","available"]
          .includes(e.status)
      ).length,

    inactive:
      employees.filter(
        e =>
          !["active","available"]
          .includes(e.status)
      ).length

  };

}