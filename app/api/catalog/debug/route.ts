import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface DebugResponse {
  timestamp: string;
  tables: Record<string, {
    exists: boolean;
    count: number;
    sample?: any[];
  } | { success: boolean; sample: any[] }>;
  errors: string[];
}

export async function GET() {
  const debug: DebugResponse = {
    timestamp: new Date().toISOString(),
    tables: {},
    errors: []
  };

  try {
    // Проверяем таблицу catalog_user_suppliers
    const { data: userSuppliers, error: userSuppliersError } = await supabase
      .from("catalog_user_suppliers")
      .select("*")
      .limit(5);

    if (userSuppliersError) {
      debug.errors.push(`catalog_user_suppliers: ${userSuppliersError.message}`);
    } else {
      debug.tables.catalog_user_suppliers = {
        exists: true,
        count: userSuppliers?.length || 0,
        sample: userSuppliers?.slice(0, 2) || []
      };
    }

    // Проверяем таблицу catalog_user_products
    const { data: userProducts, error: userProductsError } = await supabase
      .from("catalog_user_products")
      .select("*")
      .limit(5);

    if (userProductsError) {
      debug.errors.push(`catalog_user_products: ${userProductsError.message}`);
    } else {
      debug.tables.catalog_user_products = {
        exists: true,
        count: userProducts?.length || 0,
        sample: userProducts?.slice(0, 2) || []
      };
    }

    // Проверяем таблицу catalog_verified_suppliers
    const { data: verifiedSuppliers, error: verifiedSuppliersError } = await supabase
      .from("catalog_verified_suppliers")
      .select("*")
      .limit(5);

    if (verifiedSuppliersError) {
      debug.errors.push(`catalog_verified_suppliers: ${verifiedSuppliersError.message}`);
    } else {
      debug.tables.catalog_verified_suppliers = {
        exists: true,
        count: verifiedSuppliers?.length || 0,
        sample: verifiedSuppliers?.slice(0, 2) || []
      };
    }

    // Проверяем таблицу catalog_verified_products
    const { data: verifiedProducts, error: verifiedProductsError } = await supabase
      .from("catalog_verified_products")
      .select("*")
      .limit(5);

    if (verifiedProductsError) {
      debug.errors.push(`catalog_verified_products: ${verifiedProductsError.message}`);
    } else {
      debug.tables.catalog_verified_products = {
        exists: true,
        count: verifiedProducts?.length || 0,
        sample: verifiedProducts?.slice(0, 2) || []
      };
    }

    // Проверяем связи товаров с поставщиками
    const { data: linkedProducts, error: linkedError } = await supabase
      .from("catalog_user_products")
      .select(`
        id,
        name,
        supplier_id
      `)
      .limit(3);

    if (!linkedError && linkedProducts) {
      debug.tables.linked_check = {
        success: true,
        sample: linkedProducts
      };
    } else {
      debug.errors.push(`Linked check failed: ${linkedError?.message}`);
    }

    return NextResponse.json({
      status: "success",
      debug
    });

  } catch (error) {
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      debug
    }, { status: 500 });
  }
} 