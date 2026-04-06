import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Fetch all staff
export async function GET() {
  const staff = db.prepare("SELECT code, name, created_at FROM users WHERE role = 'staff'").all();
  return NextResponse.json(staff);
}

// POST: Add new staff
export async function POST(req: NextRequest) {
  const { name } = await req.json();
  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  db.prepare("INSERT INTO users (code, name, role) VALUES (?, ?, ?)").run(newCode, name, "staff");
  return NextResponse.json({ code: newCode, name });
}

// PUT: Regenerate staff code
export async function PUT(req: NextRequest) {
  const { oldCode, newCode, name } = await req.json();
  db.prepare("UPDATE users SET code = ?, name = ? WHERE code = ?").run(newCode, name, oldCode);
  // Update clients assigned to old code
  db.prepare("UPDATE clients SET assigned_staff_code = ? WHERE assigned_staff_code = ?").run(newCode, oldCode);
  return NextResponse.json({ success: true });
}

// DELETE: Remove staff
export async function DELETE(req: NextRequest) {
  const { code } = await req.json();
  db.prepare("DELETE FROM users WHERE code = ?").run(code);
  return NextResponse.json({ success: true });
}