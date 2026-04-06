import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Fetch all clients (admin) or filtered by staff code
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const staffCode = searchParams.get("staffCode");
  if (staffCode) {
    const clients = db.prepare("SELECT * FROM clients WHERE assigned_staff_code = ?").all(staffCode);
    return NextResponse.json(clients);
  } else {
    const clients = db.prepare("SELECT * FROM clients").all();
    return NextResponse.json(clients);
  }
}

// POST: Create new client
export async function POST(req: NextRequest) {
  const { name, assignedStaffCode } = await req.json();
  const id = Date.now().toString();
  db.prepare("INSERT INTO clients (id, name, assigned_staff_code, status, archived) VALUES (?, ?, ?, ?, ?)").run(id, name, assignedStaffCode, "new", 0);
  return NextResponse.json({ success: true, client: { id, name, assignedStaffCode } });
}

// PUT: Archive/unarchive client
export async function PUT(req: NextRequest) {
  const { clientId, archived } = await req.json();
  db.prepare("UPDATE clients SET archived = ? WHERE id = ?").run(archived ? 1 : 0, clientId);
  return NextResponse.json({ success: true });
}