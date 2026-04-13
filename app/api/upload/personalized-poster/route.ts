import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sizeOption = formData.get('sizeOption') as string;
    const materialType = formData.get('materialType') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and PDF are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('personalized-posters')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('personalized-posters')
      .getPublicUrl(fileName);

    // Single poster SKU: 18×24" standard (paisa)
    const sizePrices: Record<string, number> = {
      '18x24': 99900,
      A4: 29900,
      A3: 59900,
      A2: 99900,
    };

    const basePrice = sizePrices[sizeOption] ?? sizePrices['18x24'];
    const totalPrice = basePrice;

    // Save to database
    const { data: posterData, error: dbError } = await supabase
      .from('personalized_posters')
      .insert({
        user_id: user.id,
        image_file_url: publicUrl,
        image_file_name: file.name,
        image_file_size_mb: (file.size / (1024 * 1024)).toFixed(2),
        size_option: sizeOption,
        material_type: materialType,
        base_price: basePrice,
        total_price: totalPrice,
        status: 'pending',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Try to delete the uploaded file
      await supabase.storage.from('personalized-posters').remove([fileName]);
      return NextResponse.json(
        { error: 'Failed to save poster data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: posterData,
      fileUrl: publicUrl,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
