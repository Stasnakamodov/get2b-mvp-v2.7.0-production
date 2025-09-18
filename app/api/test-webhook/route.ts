import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: "OK",
    message: "Test webhook is working",
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    console.log('🧪 Test webhook received:', body);
    
    return NextResponse.json({
      success: true,
      message: "Test webhook received data successfully",
      received_data: body,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Test webhook error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to process test webhook",
        details: String(error)
      },
      { status: 500 }
    );
  }
} 