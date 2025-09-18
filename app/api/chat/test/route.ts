import { NextRequest, NextResponse } from "next/server";

// GET: Простейший тест API
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 TEST: Simple API test called');
    
    return NextResponse.json({
      success: true,
      message: "API работает!",
      timestamp: new Date().toISOString(),
      server: "running",
      port: "3000"
    });
    
  } catch (error) {
    console.error('💥 TEST: Error in test endpoint:', error);
    return NextResponse.json(
      { error: "Test failed", details: String(error) },
      { status: 500 }
    );
  }
} 