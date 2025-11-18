import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { annotationId, action, feedback } = body;

    if (!annotationId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    switch (action) {
      case 'approve':
        // Approve annotation
        const { error: approveError } = await supabase
          .from('annotations')
          .update({
            validated: true,
            validated_at: new Date().toISOString(),
            validator_id: '00000000-0000-0000-0000-000000000000', // Admin user ID
          })
          .eq('id', annotationId);

        if (approveError) {
          throw approveError;
        }

        // Update associated image status
        const { data: annotation } = await supabase
          .from('annotations')
          .select('image_id')
          .eq('id', annotationId)
          .single();

        if (annotation) {
          await supabase
            .from('images')
            .update({ status: 'approved' })
            .eq('id', annotation.image_id);
        }

        break;

      case 'reject':
        // Reject annotation
        const { error: rejectError } = await supabase
          .from('annotations')
          .update({
            validated: false,
            rejection_reason: feedback?.rejectionReason || 'Rejected by admin',
          })
          .eq('id', annotationId);

        if (rejectError) {
          throw rejectError;
        }

        // Update image status
        const { data: rejectedAnnotation } = await supabase
          .from('annotations')
          .select('image_id')
          .eq('id', annotationId)
          .single();

        if (rejectedAnnotation) {
          await supabase
            .from('images')
            .update({ status: 'rejected' })
            .eq('id', rejectedAnnotation.image_id);
        }

        break;

      case 'edit':
        // Edit annotation
        const updateData: any = {
          validated: true,
          validated_at: new Date().toISOString(),
          validator_id: '00000000-0000-0000-0000-000000000000',
        };

        if (feedback?.description) {
          updateData.description_basic = feedback.description;
        }

        if (feedback?.phrases) {
          updateData.phrases = feedback.phrases;
        }

        const { error: editError } = await supabase
          .from('annotations')
          .update(updateData)
          .eq('id', annotationId);

        if (editError) {
          throw editError;
        }

        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Annotation ${action}ed successfully`,
    });
  } catch (error) {
    console.error('Error reviewing annotation:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
