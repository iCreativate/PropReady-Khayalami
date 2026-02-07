import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export interface ChatMessage {
  id: string;
  sender: 'agent' | 'contact';
  text: string;
  timestamp: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const viewingId = searchParams.get('viewingId');
  if (!viewingId) {
    return NextResponse.json({ error: 'viewingId required' }, { status: 400 });
  }

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ messages: [] }, { status: 200 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('viewing_appointments')
      .select('chat_messages')
      .eq('id', viewingId)
      .single();

    if (error || !data) {
      return NextResponse.json({ messages: [] }, { status: 200 });
    }
    const messages = Array.isArray(data.chat_messages) ? data.chat_messages : [];
    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ messages: [] }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { viewingId, sender, text } = body;
    if (!viewingId || !sender || typeof text !== 'string') {
      return NextResponse.json({ error: 'viewingId, sender, and text required' }, { status: 400 });
    }
    if (sender !== 'agent' && sender !== 'contact') {
      return NextResponse.json({ error: 'sender must be agent or contact' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Database not configured', fallback: 'localStorage' },
        { status: 503 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: viewing, error: fetchErr } = await supabase
      .from('viewing_appointments')
      .select('chat_messages')
      .eq('id', viewingId)
      .single();

    if (fetchErr || !viewing) {
      return NextResponse.json({ error: 'Viewing not found' }, { status: 404 });
    }

    const messages: ChatMessage[] = Array.isArray(viewing.chat_messages) ? viewing.chat_messages : [];
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      sender,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    messages.push(newMsg);

    const { error: updateErr } = await supabase
      .from('viewing_appointments')
      .update({ chat_messages: messages, updated_at: new Date().toISOString() })
      .eq('id', viewingId);

    if (updateErr) {
      console.error('Viewing chat update error:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: newMsg });
  } catch (err) {
    console.error('Viewing chat API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
