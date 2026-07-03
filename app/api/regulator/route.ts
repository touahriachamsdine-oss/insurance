import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { generateUARReport, calculateSolvencyRatio, getComplianceSummary, exportUARXML } from '@/lib/integration/regulator';

/**
 * POST /api/regulator/generate
 *
 * Generate a UAR regulatory filing report
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'company_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, period } = body;

    if (!companyId || !period) {
      return NextResponse.json({ error: 'Company ID and period are required' }, { status: 400 });
    }

    const report = await generateUARReport(companyId, period, 'quarterly');
    const xmlData = await exportUARXML(report);

    // In production, save to database
    console.log(`[Regulator API] Generated report: ${report.id}`);

    return NextResponse.json({
      success: true,
      reportId: report.id,
      report,
      xmlData,
    });
  } catch (error: any) {
    console.error('[Regulator API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/regulator/solvency?companyId=xxx
 *
 * Check solvency ratio for a company
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || user.company_id;

    const solvency = await calculateSolvencyRatio(companyId);
    const compliance = await getComplianceSummary(companyId);

    return NextResponse.json({
      success: true,
      solvency,
      compliance,
    });
  } catch (error: any) {
    console.error('[Regulator API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}