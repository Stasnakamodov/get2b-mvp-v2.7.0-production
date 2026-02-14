import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { checkUserRole } from "@/lib/auth/checkRole";

/**
 * Unified suppliers API
 *
 * GET /api/catalog/suppliers
 * - ?verified=true — fetch from catalog_verified_suppliers (replaces /verified-suppliers)
 * - ?id=xxx&verified=true — single verified supplier with products
 * - Default: fetch from catalog_suppliers
 */

function sanitizeSearch(search: string): string {
  return search
    .replace(/[%_\\'"();]/g, ' ')
    .trim()
    .slice(0, 100)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const verified = searchParams.get("verified") === "true";
    const id = searchParams.get("id");
    const country = searchParams.get("country");
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");
    const search = searchParams.get("search");
    const accreditation_status = searchParams.get("accreditation_status");

    // === Verified suppliers mode (replaces /api/catalog/verified-suppliers) ===
    if (verified) {
      // Single verified supplier by ID with products
      if (id) {
        const { data, error } = await supabase
          .from("catalog_verified_suppliers")
          .select(`
            *,
            catalog_verified_products (
              id, name, price, currency, in_stock, min_order, description, category, sku, images
            )
          `)
          .eq("id", id)
          .eq("is_active", true)
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ supplier: data });
      }

      // List verified suppliers
      let query = supabase
        .from("catalog_verified_suppliers")
        .select("*")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("public_rating", { ascending: false })
        .order("projects_count", { ascending: false });

      if (category && category !== "all") query = query.eq("category", category);
      if (country && country !== "all") query = query.eq("country", country);
      if (featured === "true") query = query.eq("is_featured", true);

      if (search) {
        const sanitized = sanitizeSearch(search)
        if (sanitized) {
          query = query.or(`name.ilike.%${sanitized}%,company_name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
        }
      }

      const { data, error } = await query;
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ suppliers: data, total: data?.length || 0 });
    }

    // === Default: generic catalog_suppliers ===
    let query = supabase
      .from("catalog_suppliers")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (country) query = query.eq("country", country);
    if (category) query = query.eq("category", category);
    if (accreditation_status) query = query.eq("accreditation_status", accreditation_status);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ suppliers: data });
  } catch (error) {
    console.error("[API] Suppliers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create supplier (generic or verified)
export async function POST(request: NextRequest) {
  try {
    const supplierData = await request.json();
    const isVerified = supplierData.verified === true;

    if (isVerified) {
      // Verified supplier creation requires admin/manager role
      const roleCheck = await checkUserRole(['admin', 'manager'])
      if (!roleCheck.success) {
        return NextResponse.json({ error: roleCheck.error }, { status: roleCheck.user ? 403 : 401 });
      }

      const requiredFields = ["name", "company_name", "category", "country"];
      for (const field of requiredFields) {
        if (!supplierData[field]) {
          return NextResponse.json({ error: `Поле ${field} обязательно` }, { status: 400 });
        }
      }

      const { verified: _, ...cleanData } = supplierData;
      const { data, error } = await supabase
        .from("catalog_verified_suppliers")
        .insert([{
          ...cleanData,
          verified_by: roleCheck.user!.id,
          is_active: true,
          public_rating: 0,
          reviews_count: 0,
          projects_count: 0
        }])
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ supplier: data });
    }

    // Generic supplier
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
  } catch (error) {
    console.error("[API] Create supplier error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Update supplier (generic or verified)
export async function PATCH(request: NextRequest) {
  try {
    const { id, verified, ...updateData } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Поле id обязательно" }, { status: 400 });
    }

    if (verified) {
      const roleCheck = await checkUserRole(['admin', 'manager'])
      if (!roleCheck.success) {
        return NextResponse.json({ error: roleCheck.error }, { status: roleCheck.user ? 403 : 401 });
      }

      const { data, error } = await supabase
        .from("catalog_verified_suppliers")
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ supplier: data });
    }

    const { data, error } = await supabase
      .from("catalog_suppliers")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ supplier: data });
  } catch (error) {
    console.error("[API] Update supplier error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Soft delete supplier (generic or verified)
export async function DELETE(request: NextRequest) {
  try {
    const { id, verified } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Поле id обязательно" }, { status: 400 });
    }

    const tableName = verified ? "catalog_verified_suppliers" : "catalog_suppliers";
    const { data, error } = await supabase
      .from(tableName)
      .update({ is_active: false })
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ supplier: data });
  } catch (error) {
    console.error("[API] Delete supplier error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 