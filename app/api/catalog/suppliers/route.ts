import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: Получение списка поставщиков с фильтрацией
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country");
  const category = searchParams.get("category");
  const accreditation_status = searchParams.get("accreditation_status");
  const is_active = searchParams.get("is_active");

  let query = supabase
    .from("catalog_suppliers")
    .select("*")
    .eq("is_active", true) // Показываем только активных поставщиков
    .order("created_at", { ascending: false });

  if (country) query = query.eq("country", country);
  if (category) query = query.eq("category", category);
  if (accreditation_status) query = query.eq("accreditation_status", accreditation_status);
  if (is_active !== null && is_active !== undefined) query = query.eq("is_active", is_active === "true");

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ suppliers: data });
}

// POST: Добавление нового поставщика
export async function POST(request: NextRequest) {
  const supplierData = await request.json();

  // Валидация обязательных полей
  const requiredFields = ["company_name", "country", "category", "contact_email"];
  for (const field of requiredFields) {
    if (!supplierData[field]) {
      return NextResponse.json({ error: `Поле ${field} обязательно` }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("catalog_suppliers")
    .insert([supplierData])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ supplier: data });
}

// PATCH: Обновление поставщика
export async function PATCH(request: NextRequest) {
  const { id, ...updateData } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Поле id обязательно для обновления" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("catalog_suppliers")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ supplier: data });
}

// DELETE: Удаление поставщика (мягкое удаление через is_active)
export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Поле id обязательно для удаления" }, { status: 400 });
  }
  // Мягкое удаление: просто ставим is_active = false
  const { data, error } = await supabase
    .from("catalog_suppliers")
    .update({ is_active: false })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ supplier: data });
} 