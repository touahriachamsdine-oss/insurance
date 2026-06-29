import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { queryOne, query, getClient } from '@/lib/db';

export async function POST(request: Request) {
  const dbClient = await getClient();
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'company_admin' && user.role !== 'company_agent')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { transferId, status, rejectionReason } = await request.json();
    if (!transferId || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ message: 'Invalid transfer review payload' }, { status: 400 });
    }

    // Verify transfer request and check that the user belongs to the releasing (from_company_id) or target company
    const transfer = await queryOne(
      'SELECT * FROM public.transfer_requests WHERE id = $1',
      [transferId]
    );
    if (!transfer) {
      return NextResponse.json({ message: 'Transfer request not found' }, { status: 404 });
    }

    // Only the source company (from_company_id) can approve/reject the release
    if (transfer.from_company_id !== user.company_id) {
      return NextResponse.json({ message: 'Forbidden. Only the releasing company can review transfer requests.' }, { status: 403 });
    }

    await dbClient.query('BEGIN');

    // Update transfer request status
    const updatedTransfer = (await dbClient.query(
      `UPDATE public.transfer_requests
       SET status = $1,
           rejection_reason = $2,
           reviewed_by = $3,
           reviewed_at = NOW(),
           completed_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE NULL END
       WHERE id = $4
       RETURNING *`,
      [status, status === 'rejected' ? (rejectionReason || null) : null, user.id, transferId]
    )).rows[0];

    // If approved, update the contract to the new company
    if (status === 'approved') {
      await dbClient.query(
        `UPDATE public.contracts
         SET company_id = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [transfer.to_company_id, transfer.contract_id]
      );
    }

    await dbClient.query('COMMIT');

    // Notify the client about transfer outcome
    const notificationTitleAr = status === 'approved' ? 'تمت الموافقة على تحويل العقد' : 'تم رفض طلب تحويل العقد';
    const notificationTitleEn = status === 'approved' ? 'Contract transfer request approved' : 'Contract transfer request rejected';
    const notificationBodyAr = status === 'approved'
      ? 'تمت الموافقة على تحويل عقد التأمين الخاص بك إلى الشركة الجديدة بنجاح.'
      : `تم رفض طلب تحويل العقد. السبب: ${rejectionReason || 'غير محدد'}`;
    const notificationBodyEn = status === 'approved'
      ? 'Your insurance contract transfer request has been successfully approved.'
      : `Your contract transfer request was rejected. Reason: ${rejectionReason || 'Not specified'}`;

    await query(
      `INSERT INTO public.notifications (user_id, type, title_ar, title_en, body_ar, body_en, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        transfer.client_id,
        'contract_transfer',
        notificationTitleAr,
        notificationTitleEn,
        notificationBodyAr,
        notificationBodyEn,
        false
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Transfer request processed successfully',
      transfer: updatedTransfer
    });
  } catch (err: any) {
    await dbClient.query('ROLLBACK');
    console.error('Error reviewing transfer:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {
    dbClient.release();
  }
}
