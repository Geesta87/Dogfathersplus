import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const KIE_API_KEY = Deno.env.get('KIE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { genre, genreStyle, subGenre, occasion, occasionPrompt, recipientName, senderName, relationship, details, email, voiceType, artistInspiration } = body;

    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured');
    if (!KIE_API_KEY) throw new Error('KIE_API_KEY not configured');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Start with the base genre style
    let enhancedStyle = genreStyle;
    
    // If artist inspiration provided, use Claude to translate to production tags
    if (artistInspiration && artistInspiration.trim()) {
      console.log('Translating artist inspiration:', artistInspiration);
      
      const artistPrompt = `You are a Mexican and Latin music production expert with deep knowledge of regional Mexican, tropical, and urban Latin genres.

The user wants a ${genre} song inspired by the artist: ${artistInspiration}

Your task is to analyze this artist's signature sound and translate it into specific PRODUCTION TAGS for an AI music generator.

IMPORTANT RULES:
1. NEVER include artist names in the output - only describe the SOUND
2. Focus on: instruments, tempo (BPM), vocal style, production techniques, mood
3. Stay TRUE to the ${genre} genre while incorporating the artist's essence
4. Be SPECIFIC - avoid generic terms like "good" or "nice"
5. Maximum 60 words, comma-separated tags only

ANALYZE THE ARTIST'S SOUND:
- What instruments define their sound?
- What's their typical tempo range?
- How would you describe the vocal delivery? (rough, smooth, falsetto, powerful, nasal, etc.)
- What production characteristics? (dry, reverb-heavy, compressed, raw, polished)
- What emotional qualities? (melancholic, triumphant, romantic, aggressive, playful)

BASE STYLE TO BUILD UPON:
${genreStyle}

OUTPUT FORMAT:
Return ONLY comma-separated production tags. No explanations, no artist names, no sentences.

EXAMPLE OUTPUT:
"accordion-driven norteño, polka rhythm 115 BPM, rough baritone vocals, dry authentic recording, bajo sexto prominence, simple percussion, cantina atmosphere, working-class themes, storytelling delivery"`;

      const styleResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'x-api-key': ANTHROPIC_API_KEY!, 
          'anthropic-version': '2023-06-01' 
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          messages: [{ role: 'user', content: artistPrompt }]
        })
      });
      
      const styleData = await styleResponse.json();
      if (styleResponse.ok && styleData.content?.[0]?.text) {
        enhancedStyle = styleData.content[0].text.trim();
        // Remove any quotes that might be included
        enhancedStyle = enhancedStyle.replace(/^["']|["']$/g, '');
        console.log('Enhanced style from Claude:', enhancedStyle);
      }
    }

    // Add voice type to style
    const voiceDesc = voiceType === 'female' 
      ? 'female vocals, feminine voice, woman singer' 
      : voiceType === 'duet' 
      ? 'male and female duet, two voices harmonizing, duet vocals' 
      : 'male vocals, masculine voice, man singer';
    
    const finalStyle = `${enhancedStyle}, ${voiceDesc}`;
    console.log('Final style:', finalStyle);

    // Generate lyrics with improved prompt
    console.log('Generating lyrics...');
    
    const lyricsPrompt = `Eres un compositor experto de música ${genre} mexicana/latina. Escribe una letra auténtica y emotiva.

CANCIÓN PARA: ${recipientName}
DE PARTE DE: ${senderName}
${relationship ? `RELACIÓN: ${relationship}` : ''}
OCASIÓN: ${occasionPrompt}
HISTORIA/DETALLES: ${details}

REGLAS IMPORTANTES:
1. Menciona el nombre "${recipientName}" al menos 2-3 veces de forma natural
2. Usa español mexicano auténtico (no español de España)
3. Incluye expresiones y modismos apropiados para ${genre}
4. La letra debe tener estructura musical clara
5. Sé emotivo pero no cursi - busca autenticidad
6. Incluye detalles específicos de la historia proporcionada
7. El tono debe coincidir con la ocasión: ${occasion}

ESTRUCTURA REQUERIDA:
[Verso 1]
(4-6 líneas)

[Coro]
(4-6 líneas - la parte más memorable y emotiva)

[Verso 2]
(4-6 líneas)

[Coro]
(repetir)

[Verso 3 o Puente]
(4-6 líneas)

[Coro Final]
(puede tener variación)

IMPORTANTE: Solo responde con la letra. Nada de explicaciones ni comentarios.`;

    const lyricsResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'x-api-key': ANTHROPIC_API_KEY!, 
        'anthropic-version': '2023-06-01' 
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: lyricsPrompt }]
      })
    });
    
    const lyricsData = await lyricsResponse.json();
    if (!lyricsResponse.ok || !lyricsData.content?.[0]?.text) {
      throw new Error('Failed to generate lyrics: ' + JSON.stringify(lyricsData));
    }
    const lyrics = lyricsData.content[0].text;
    console.log('Lyrics generated successfully');

    // Create PROCESSING record in database
    const { data: songRecord, error: dbError } = await supabase.from('songs').insert({
      recipient_name: recipientName,
      sender_name: senderName,
      relationship: relationship,
      genre: genre,
      sub_genre: subGenre || null,
      occasion: occasion,
      details: details,
      email: email,
      lyrics: lyrics,
      audio_url: null,
      preview_url: null,
      status: 'processing',
      paid: false,
      voice_type: voiceType || 'male',
      artist_inspiration: artistInspiration || null,
      style_used: finalStyle
    }).select().single();

    if (dbError) throw new Error('DB error: ' + dbError.message);
    const songId = songRecord.id;
    console.log('Created processing record:', songId);

    // Start Kie.ai generation with callback
    console.log('Starting Kie.ai generation...');
    const callBackUrl = 'https://yzbvajungshqcpusfiia.supabase.co/functions/v1/song-callback';
    
    const musicResponse = await fetch('https://api.kie.ai/api/v1/generate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${KIE_API_KEY}` 
      },
      body: JSON.stringify({
        prompt: lyrics,
        customMode: true,
        style: finalStyle,
        title: `Canción para ${recipientName}`,
        instrumental: false,
        model: 'V4_5',
        callBackUrl: callBackUrl
      })
    });
    
    const musicData = await musicResponse.json();
    console.log('Kie.ai response:', JSON.stringify(musicData));
    
    const taskId = musicData.data?.taskId;
    if (!taskId) {
      await supabase.from('songs').update({ status: 'failed' }).eq('id', songId);
      throw new Error('No taskId from Kie.ai: ' + JSON.stringify(musicData));
    }

    // Save taskId
    await supabase.from('songs').update({ task_id: taskId }).eq('id', songId);
    console.log('TaskId saved:', taskId);

    // Return immediately - frontend will poll for status
    return new Response(JSON.stringify({
      success: true,
      song: {
        id: songId,
        status: 'processing'
      }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
