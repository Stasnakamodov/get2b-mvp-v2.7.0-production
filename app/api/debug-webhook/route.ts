import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.error('🔍 DEBUG WEBHOOK CALLED!');
  
  try {
    const body = await request.json();
    
    console.error('📋 DEBUG: Received payload:', JSON.stringify(body, null, 2));
    
    // Проверяем есть ли сообщение
    if (!body.message) {
      console.error('❌ DEBUG: No message in payload');
      return NextResponse.json({ 
        success: false, 
        error: "No message found",
        received: body 
      });
    }
    
    const message = body.message;
    const text = message.text || '';
    
    console.error('✅ DEBUG: Message found:', {
      text,
      hasReply: !!message.reply_to_message,
      replyText: message.reply_to_message?.text,
      fromUser: message.from?.first_name,
      userId: message.from?.id
    });
    
    // Проверяем reply_to_message
    if (message.reply_to_message) {
      const replyText = message.reply_to_message.text || '';
      console.error('🔍 DEBUG: Reply message:', replyText);
      
      const projectMatch = replyText.match(/🆔 Проект: ([a-f0-9-]+)/);
      if (projectMatch) {
        console.error('✅ DEBUG: Found project ID:', projectMatch[1]);
      } else {
        console.error('❌ DEBUG: No project ID found in reply');
      }
    } else {
      console.error('❌ DEBUG: No reply_to_message');
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Debug webhook processed",
      analysis: {
        hasMessage: !!body.message,
        messageText: text,
        hasReply: !!message.reply_to_message,
        replyText: message.reply_to_message?.text,
        hasProjectId: !!(message.reply_to_message?.text?.match(/🆔 Проект: ([a-f0-9-]+)/))
      }
    });
    
  } catch (error) {
    console.error('💥 DEBUG: Error processing webhook:', error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    });
  }
} 