// supabase/functions/generate-song/index.ts
// Deploy with: supabase functions deploy generate-song

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment variables (set in Supabase dashboard)
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const KIE_API_KEY = Deno.env.get('KIE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
const SENDER_EMAIL = 'support@proactivesolutions.io';
const SENDER_NAME = 'RegalosQueCantan';

// Helper function to send emails via SendGrid
async function sendEmail(to: string, subject: string, htmlContent: string) {
  if (!SENDGRID_API_KEY) {
    console.warn('SENDGRID_API_KEY not set, skipping email');
    return null;
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SENDGRID_API_KEY}`
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: SENDER_EMAIL, name: SENDER_NAME },
        subject: subject,
        content: [{ type: 'text/html', value: htmlContent }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SendGrid error:', response.status, errorText);
      return null;
    }

    console.log('Email sent successfully to:', to);
    return response;
  } catch (error) {
    console.error('Email send error:', error);
    return null;
  }
}

// Email template for preview ready notification
function getPreviewReadyEmailHtml(song: any, previewLink: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f3f1; font-family: 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f3f1; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1A4338 0%, #2D5A3D 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #D4AF37; font-size: 32px; margin: 0; font-weight: bold;">🎵 RegalosQueCantan</h1>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <div style="font-size: 60px; margin-bottom: 20px;">🎧</div>
                    <h2 style="color: #1A4338; font-size: 28px; margin: 0 0 10px;">¡Tu canción está lista!</h2>
                    <p style="color: #666; font-size: 16px; margin: 0;">Escucha el preview de la canción para <strong>${song.recipient_name}</strong></p>
                  </div>
                  
                  <!-- Song Details Card -->
                  <div style="background: #f8f7f6; padding: 24px; border-radius: 12px; margin-bottom: 30px;">
                    <table width="100%" style="font-size: 15px;">
                      <tr>
                        <td style="padding: 8px 0; color: #666; width: 100px;">Género:</td>
                        <td style="padding: 8px 0; color: #1A4338; font-weight: bold; text-transform: capitalize;">${song.genre}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666;">Ocasión:</td>
                        <td style="padding: 8px 0; color: #1A4338; font-weight: bold; text-transform: capitalize;">${song.occasion || 'Especial'}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${previewLink}" style="display: inline-block; background: linear-gradient(135deg, #E11D74 0%, #C41962 100%); color: white; padding: 18px 40px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(225,29,116,0.4);">
                      🎧 Escuchar Preview GRATIS
                    </a>
                  </div>
                  
                  <p style="color: #888; font-size: 14px; text-align: center; margin-top: 20px;">
                    ¿Te gusta? Compra la canción completa por solo <strong style="color: #1A4338;">$19.99 USD</strong>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px; text-align: center; border-top: 1px solid #e4e3dc;">
                  <p style="color: #999; font-size: 12px; margin: 0 0 10px;">
                    ¿Preguntas? Responde a este correo o escríbenos a<br>
                    <a href="mailto:support@proactivesolutions.io" style="color: #1A4338;">support@proactivesolutions.io</a>
                  </p>
                  <p style="color: #ccc; font-size: 11px; margin: 0;">
                    © 2024 RegalosQueCantan. Hecho con ❤️ para ti.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      genre, 
      genreStyle, 
      subGenre,
      occasion, 
      occasionPrompt, 
      recipientName, 
      senderName, 
      relationship, 
      details, 
      email,
      voiceType,
      artistInspiration
    } = await req.json();

    // Validate required API keys
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    if (!KIE_API_KEY) {
      throw new Error('KIE_API_KEY not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Step 0: If artist inspiration provided, translate to style description using Claude
    let enhancedStyle = genreStyle;
    
    if (artistInspiration && artistInspiration.trim()) {
      console.log('Translating artist inspiration:', artistInspiration);
      
      const styleResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: `The user wants a ${genre} song inspired by: ${artistInspiration}

Describe the musical style, production elements, and sonic characteristics of this artist/these artists in a way that can be used as a music generation prompt for Suno AI.

RULES:
- DO NOT include any artist names in your response
- DO NOT mention vocals being "like" anyone specific
- DO NOT use quotation marks
- Focus on: instruments, production style, tempo, rhythm patterns, mood, regional influences, era/decade sound

Base genre style to enhance: ${genreStyle}

Return ONLY a comma-separated list of musical descriptors (50-80 words max). No explanations, no sentences, just the style tags.

Example format: corrido tumbado, trap 808 bass, acoustic requinto guitar, melancholic male vocals, slow tempo 75 BPM, regional Mexican trap, emotional delivery, modern production`
          }]
        })
      });

      const styleData = await styleResponse.json();
      
      if (styleResponse.ok && styleData.content?.[0]?.text) {
        enhancedStyle = styleData.content[0].text.trim();
        console.log('Enhanced style:', enhancedStyle);
      } else {
        console.warn('Could not translate artist style, using default');
      }
    }

    // Add voice type to style
    const voiceDescriptor = voiceType === 'female' 
      ? 'female vocals, woman singer' 
      : voiceType === 'duet'
        ? 'duet, male and female vocals together'
        : 'male vocals, man singer';
    
    const finalStyle = `${enhancedStyle}, ${voiceDescriptor}`;
    console.log('Final style for Suno:', finalStyle);

    // Step 1: Generate lyrics with Claude
    console.log('Generating lyrics with Claude...');
    const lyricsResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Escribe la letra de ${occasionPrompt} en español mexicano para el género musical "${genre}".

DETALLES IMPORTANTES:
- Para: ${recipientName}
- De: ${senderName}
${relationship ? `- Relación: ${relationship}` : ''}
- Historia personal: ${details}
${artistInspiration ? `- Estilo inspirado en: ${artistInspiration} (usa su estilo lírico/temático, NO menciones al artista)` : ''}

INSTRUCCIONES:
1. La canción debe ser de 2-3 minutos (aproximadamente 3-4 versos y 2-3 coros)
2. Incluye el nombre "${recipientName}" naturalmente en la letra al menos 2 veces
3. Menciona "${senderName}" como quien dedica la canción
4. Usa los detalles personales para hacer la letra única y emotiva
5. Mantén el estilo del género ${genre}
6. Usa lenguaje coloquial mexicano apropiado
7. Incluye [Verso 1], [Coro], [Verso 2], etc. como marcadores

Escribe SOLO la letra, sin explicaciones adicionales.`
        }]
      })
    });

    const lyricsData = await lyricsResponse.json();
    
    if (!lyricsResponse.ok || !lyricsData.content?.[0]?.text) {
      console.error('Claude API error:', JSON.stringify(lyricsData));
      throw new Error(`Claude API error: ${lyricsData.error?.message || 'Failed to generate lyrics'}`);
    }
    
    const lyrics = lyricsData.content[0].text;
    console.log('Lyrics generated successfully');

    // Step 2: Generate music with Kie.ai (Suno API)
    console.log('Creating music with Kie.ai...');
    console.log('Style being sent:', finalStyle);
    
    // Kie.ai requires a callBackUrl even if we poll for results
    const callBackUrl = `${SUPABASE_URL}/functions/v1/song-callback`;
    
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
      // Include actual error from API in the response
      const apiError = musicData.message || musicData.error || JSON.stringify(musicData);
      throw new Error(`Failed to create music task: ${apiError}`);
    }

    console.log('Music task created:', taskId);

    // Step 3: Poll for completion (max 120 seconds)
    let audioUrl = null;
    let attempts = 0;
    const maxAttempts = 40; // 40 attempts * 3 seconds = 120 seconds

    while (!audioUrl && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      
      const statusResponse = await fetch(`https://api.kie.ai/api/v1/query?taskId=${taskId}`, {
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`
        }
      });

      const statusData = await statusResponse.json();
      console.log('Status check:', attempts + 1, statusData.data?.status);

      if (statusData.data?.status === 'complete' && statusData.data?.songs?.[0]?.audioUrl) {
        audioUrl = statusData.data.songs[0].audioUrl;
        break;
      }

      if (statusData.data?.status === 'failed') {
        throw new Error('Music generation failed');
      }

      attempts++;
    }

    if (!audioUrl) {
      throw new Error('Music generation timed out');
    }

    console.log('Audio URL received:', audioUrl);

    // Step 4: Download audio and upload to Supabase Storage
    const audioResponse = await fetch(audioUrl);
    const audioBlob = await audioResponse.blob();
    
    const fileName = `songs/${Date.now()}_${recipientName.replace(/\s/g, '_')}.mp3`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio')
      .upload(fileName, audioBlob, {
        contentType: 'audio/mpeg',
        cacheControl: '3600'
      });

    if (uploadError) {
      throw new Error('Failed to upload audio: ' + uploadError.message);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('audio')
      .getPublicUrl(fileName);

    const publicAudioUrl = publicUrlData.publicUrl;

    // Step 5: Create 10-second preview (in production, use FFmpeg)
    // For now, we'll use the same URL and handle preview on frontend
    const previewUrl = publicAudioUrl; // In production: generate actual 10s clip

    // Step 6: Save to database
    const { data: songRecord, error: dbError } = await supabase
      .from('songs')
      .insert({
        recipient_name: recipientName,
        sender_name: senderName,
        relationship: relationship,
        genre: genre,
        sub_genre: subGenre || null,
        occasion: occasion,
        details: details,
        email: email,
        lyrics: lyrics,
        audio_url: publicAudioUrl,
        preview_url: previewUrl,
        status: 'completed',
        paid: false,
        voice_type: voiceType || 'male',
        artist_inspiration: artistInspiration || null,
        style_used: finalStyle
      })
      .select()
      .single();

    if (dbError) {
      throw new Error('Failed to save song: ' + dbError.message);
    }

    console.log('Song saved to database:', songRecord.id);

    // Step 7: Send preview ready email notification
    if (email) {
      const previewLink = `https://regalosquecantan.com/preview/${songRecord.id}`;
      await sendEmail(
        email,
        `🎧 ¡Tu canción para ${recipientName} está lista!`,
        getPreviewReadyEmailHtml(songRecord, previewLink)
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        song: {
          id: songRecord.id,
          title: `Canción para ${recipientName}`,
          genre: genre,
          occasion: occasion,
          previewUrl: previewUrl,
          lyrics: lyrics.substring(0, 200) + '...',
          duration: '2:45'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
