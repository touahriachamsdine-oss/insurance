import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { queryOne, query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'company_admin' && user.role !== 'company_agent')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { claimId, status, approvedAmount, rejectionReason } = await request.json();
    if (!claimId || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ message: 'Invalid claim review payload' }, { status: 400 });
    }

    // Verify claim belongs to user's company
    const claim = await queryOne(
      'SELECT id, company_id FROM public.claims WHERE id = $1',
      [claimId]
    );
    if (!claim) {
      return NextResponse.json({ message: 'Claim not found' }, { status: 404 });
    }

    if (claim.company_id !== user.company_id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const updatedClaim = await queryOne(
      `UPDATE public.claims
       SET status = $1, 
           approved_amount = $2, 
           rejection_reason = $3,
           reviewed_by = $4, 
           reviewed_at = NOW(),
           paid_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE NULL END
       WHERE id = $5
       RETURNING *`,
      [
        status, 
        status === 'approved' ? (approvedAmount || 0) : null,
        status === 'rejected' ? (rejectionReason || null) : null,
        user.id, 
        claimId
      ]
    );

    // Create a notification for the client
    const notificationTitleAr = status === 'approved' ? 'تم قبول مطالبة التأمين الخاص بك' : 'تم رفض مطالبة التأمين الخاص بك';
    const notificationTitleEn = status === 'approved' ? 'Your insurance claim was approved' : 'Your insurance claim was rejected';
    const notificationBodyAr = status === 'approved' 
      ? `تمت الموافقة على مطالبتك رقم ${updatedClaim.claim_number} بمبلغ مقدر بـ ${approvedAmount} د.ج.` 
      : `تم رفض مطالبتك رقم ${updatedClaim.claim_number}.${rejectionReason ? ` السبب: ${rejectionReason}` : ' يرجى مراجعة التفاصيل.'}`;
    const notificationBodyEn = status === 'approved' 
      ? `Your claim #${updatedClaim.claim_number} has been approved with an amount of ${approvedAmount} DZD.` 
      : `Your claim #${updatedClaim.claim_number} has been rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ' Please review details.'}`;

    await query(
      `INSERT INTO public.notifications (user_id, type, title_ar, title_en, body_ar, body_en, is_read, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        updatedClaim.client_id,
        'claim_status',
        notificationTitleAr,
        notificationTitleEn,
        notificationBodyAr,
        notificationBodyEn,
        false,
        JSON.stringify({ claimId: updatedClaim.id, status: updatedClaim.status })
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Claim reviewed successfully',
      claim: updatedClaim
    });
  } catch (err: any) {
    console.error('Error reviewing claim:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
