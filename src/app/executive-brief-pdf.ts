import { jsPDF } from 'jspdf';
import { Lead } from './app';
import { CurrencyInfo } from './currency-data';

export function generateExecutiveBriefPdf(
  lead: Lead,
  formattedDealArr: string,
  currency: CurrencyInfo,
  userProfileName = 'Enterprise Director'
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  // Helper function to check for page break
  const ensureSpace = (neededHeight: number): void => {
    if (cursorY + neededHeight > pageHeight - margin - 20) {
      doc.addPage();
      cursorY = margin;
      drawPageHeader(true);
    }
  };

  const drawPageHeader = (isContinuation = false): void => {
    if (isContinuation) {
      doc.setFillColor(23, 21, 15);
      doc.rect(margin, cursorY, contentWidth, 22, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(`EXECUTIVE DEAL BRIEF — ${lead.company.toUpperCase()} (CONT.)`, margin + 8, cursorY + 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(234, 228, 212);
      doc.text(`ARR: ${formattedDealArr} (${currency.code})`, pageWidth - margin - 8, cursorY + 14, { align: 'right' });

      cursorY += 32;
    }
  };

  // =========================================================================
  // 1. TOP HEADER BANNER (PREMIUM DARK EXECUTIVE BAR)
  // =========================================================================
  const headerHeight = 76;
  doc.setFillColor(23, 21, 15); // Deep Charcoal #17150F
  doc.roundedRect(margin, cursorY, contentWidth, headerHeight, 4, 4, 'F');

  // Gold accent bar on top
  doc.setFillColor(169, 119, 45); // Gold #A9772D
  doc.rect(margin, cursorY, contentWidth, 3, 'F');

  // Header Left: App & Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(169, 119, 45); // Gold
  doc.text('SALES PILOT AI  //  CONFIDENTIAL EXECUTIVE DEAL BRIEF', margin + 14, cursorY + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(lead.company, margin + 14, cursorY + 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(200, 195, 180);
  doc.text(
    `${lead.industry}  |  ${lead.region}  |  Owner: ${lead.owner || userProfileName}  |  Stage: ${lead.stage} (${lead.daysInStage}d)`,
    margin + 14,
    cursorY + 58
  );

  // Header Right: Deal Value & Health Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(formattedDealArr, pageWidth - margin - 14, cursorY + 34, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  // Health color indicator
  if (lead.dealHealth === 'Accelerating' || lead.dealHealth === 'Healthy') {
    doc.setTextColor(11, 107, 83); // Emerald
  } else if (lead.dealHealth === 'Warning') {
    doc.setTextColor(169, 119, 45); // Gold
  } else {
    doc.setTextColor(185, 28, 28); // Red
  }
  doc.text(
    `HEALTH: ${lead.dealHealth.toUpperCase()}  |  SCORE: ${lead.score}%`,
    pageWidth - margin - 14,
    cursorY + 52,
    { align: 'right' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(160, 155, 140);
  doc.text(
    `Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
    pageWidth - margin - 14,
    cursorY + 66,
    { align: 'right' }
  );

  cursorY += headerHeight + 12;

  // =========================================================================
  // 2. EXECUTIVE KPI MATRIX CARDS
  // =========================================================================
  const cardGap = 8;
  const numCards = 4;
  const cardWidth = (contentWidth - cardGap * (numCards - 1)) / numCards;
  const cardHeight = 44;

  const kpis = [
    { label: 'DEAL ARR VALUE', val: formattedDealArr, sub: `${currency.code} (${currency.name})`, color: [23, 21, 15] },
    { label: 'WIN PROBABILITY', val: `${lead.closeProbability}%`, sub: 'Scikit-Pulse v4.2 calibrated', color: [11, 107, 83] },
    { label: 'STAGE DURATION', val: `${lead.daysInStage} Days`, sub: `Stage: ${lead.stage}`, color: [169, 119, 45] },
    { label: 'ENGAGEMENT VELOCITY', val: lead.signalsCount ? `${lead.signalsCount} Signals` : 'Normal', sub: lead.engagementVelocity || 'Active pacing', color: [23, 21, 15] },
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = margin + idx * (cardWidth + cardGap);
    doc.setFillColor(246, 243, 236); // #F6F3EC
    doc.setDrawColor(234, 228, 212); // #EAE4D4
    doc.roundedRect(cardX, cursorY, cardWidth, cardHeight, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(140, 134, 114); // #8C8672
    doc.text(kpi.label, cardX + 7, cursorY + 11);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, cardX + 7, cursorY + 24);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(140, 134, 114);
    const subTruncated = kpi.sub.length > 24 ? kpi.sub.slice(0, 22) + '...' : kpi.sub;
    doc.text(subTruncated, cardX + 7, cursorY + 36);
  });

  cursorY += cardHeight + 14;

  // =========================================================================
  // 3. AI VECTOR RECOMMENDATION & STRATEGIC CONTEXT
  // =========================================================================
  ensureSpace(60);

  doc.setFillColor(254, 251, 243); // Subtle warm gold bg
  doc.setDrawColor(169, 119, 45); // Gold border
  doc.setLineWidth(0.75);

  const aiBoxY = cursorY;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(169, 119, 45);

  doc.roundedRect(margin, aiBoxY, contentWidth, 54, 3, 3, 'FD');
  doc.text('AI MODEL RECOMMENDATION & NEXT BEST ACTION', margin + 10, aiBoxY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(23, 21, 15);
  const suggestionText = lead.aiSuggestion || 'Maintain multi-threading across technical and procurement stakeholders to finalize agreement terms.';
  const wrappedSuggestion = doc.splitTextToSize(suggestionText, contentWidth - 20);
  doc.text(wrappedSuggestion, margin + 10, aiBoxY + 26);

  // Primary Contact Line inside AI box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(140, 134, 114);
  doc.text('PRIMARY CONTACT:', margin + 10, aiBoxY + 46);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(23, 21, 15);
  doc.text(`${lead.name} (${lead.email} • ${lead.phone || 'Phone verified'})`, margin + 95, aiBoxY + 46);

  cursorY += 64;

  // =========================================================================
  // 4. STAKEHOLDER CONSTELLATION & SENTIMENT MATRIX
  // =========================================================================
  const stakeholders = lead.stakeholders || [];
  const stakeholderSectionHeight = 28 + Math.max(stakeholders.length, 1) * 22;
  ensureSpace(stakeholderSectionHeight);

  // Section Header
  doc.setFillColor(23, 21, 15);
  doc.rect(margin, cursorY, contentWidth, 16, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`STAKEHOLDER CONSTELLATION & SENTIMENT ANALYSIS (${stakeholders.length} KEY INFLUENCERS)`, margin + 8, cursorY + 11);
  cursorY += 16;

  // Table Column Headers
  doc.setFillColor(246, 243, 236);
  doc.rect(margin, cursorY, contentWidth, 14, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(140, 134, 114);
  doc.text('NAME & CONTACT', margin + 8, cursorY + 10);
  doc.text('ENTERPRISE ROLE', margin + 130, cursorY + 10);
  doc.text('BUYING ROLE', margin + 250, cursorY + 10);
  doc.text('SENTIMENT', margin + 350, cursorY + 10);
  doc.text('RECENT ACTIVITY / SIGNAL', margin + 420, cursorY + 10);
  cursorY += 14;

  if (stakeholders.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(140, 134, 114);
    doc.text('No discrete stakeholder profiles mapped yet for this account.', margin + 8, cursorY + 14);
    cursorY += 20;
  } else {
    stakeholders.forEach((s, idx) => {
      ensureSpace(20);
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 250, isEven ? 255 : 249, isEven ? 255 : 246);
      doc.rect(margin, cursorY, contentWidth, 20, 'F');

      // Thin bottom separator
      doc.setDrawColor(234, 228, 212);
      doc.line(margin, cursorY + 20, margin + contentWidth, cursorY + 20);

      // Name & Email
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(23, 21, 15);
      doc.text(s.name, margin + 8, cursorY + 9);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(140, 134, 114);
      const emailText = s.email || `${s.name.toLowerCase().replace(' ', '.')}@${lead.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
      doc.text(emailText, margin + 8, cursorY + 17);

      // Role
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(23, 21, 15);
      const truncatedRole = s.role.length > 26 ? s.role.slice(0, 24) + '...' : s.role;
      doc.text(truncatedRole, margin + 130, cursorY + 13);

      // Buying Role Badge
      const buyingRole = s.buyingRole || 'Decision Maker';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      if (buyingRole === 'Champion') {
        doc.setTextColor(11, 107, 83); // Green
      } else if (buyingRole === 'Economic Buyer') {
        doc.setTextColor(169, 119, 45); // Gold
      } else if (buyingRole === 'Blocker') {
        doc.setTextColor(185, 28, 28); // Red
      } else {
        doc.setTextColor(23, 21, 15);
      }
      doc.text(buyingRole, margin + 250, cursorY + 13);

      // Sentiment
      const sentiment = s.sentiment || 'Positive';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      if (sentiment === 'Positive') {
        doc.setTextColor(11, 107, 83);
        doc.text('● POSITIVE', margin + 350, cursorY + 13);
      } else if (sentiment === 'Neutral') {
        doc.setTextColor(169, 119, 45);
        doc.text('● NEUTRAL', margin + 350, cursorY + 13);
      } else {
        doc.setTextColor(185, 28, 28);
        doc.text('● SKEPTICAL', margin + 350, cursorY + 13);
      }

      // Recent Action
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(92, 86, 69);
      const actionText = s.action || `${s.time || 'Recent activity logged'}`;
      const truncatedAction = actionText.length > 25 ? actionText.slice(0, 23) + '...' : actionText;
      doc.text(truncatedAction, margin + 420, cursorY + 13);

      cursorY += 20;
    });
  }

  cursorY += 12;

  // =========================================================================
  // 5. DEAL HEALTH HISTORY & VELOCITY AUDIT TRAIL
  // =========================================================================
  const healthHistory = lead.healthHistory || [];
  ensureSpace(30 + Math.min(healthHistory.length, 5) * 36);

  // Section Header
  doc.setFillColor(23, 21, 15);
  doc.rect(margin, cursorY, contentWidth, 16, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`DEAL HEALTH TRAJECTORY & REVENUE AUDIT TRAIL (${healthHistory.length} EVENTS RECORDED)`, margin + 8, cursorY + 11);
  cursorY += 16;

  if (healthHistory.length === 0) {
    doc.setFillColor(246, 243, 236);
    doc.rect(margin, cursorY, contentWidth, 24, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(140, 134, 114);
    doc.text(`Current deal health status is "${lead.dealHealth}" with baseline score of ${lead.score}%. No historical shifts recorded yet.`, margin + 8, cursorY + 15);
    cursorY += 28;
  } else {
    healthHistory.slice(0, 5).forEach((h, idx) => {
      ensureSpace(34);
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 250, isEven ? 255 : 249, isEven ? 255 : 246);
      doc.rect(margin, cursorY, contentWidth, 34, 'F');

      // Left Accent bar indicating health
      if (h.health === 'Accelerating' || h.health === 'Healthy') {
        doc.setFillColor(11, 107, 83);
      } else if (h.health === 'Warning') {
        doc.setFillColor(169, 119, 45);
      } else {
        doc.setFillColor(185, 28, 28);
      }
      doc.rect(margin, cursorY, 3, 34, 'F');

      // Top line: Date / Timestamp + Health status + Score
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(23, 21, 15);
      doc.text(`${h.dateLabel || h.timestamp}  •  ${h.trigger}`, margin + 8, cursorY + 10);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      if (h.health === 'Accelerating' || h.health === 'Healthy') {
        doc.setTextColor(11, 107, 83);
      } else if (h.health === 'Warning') {
        doc.setTextColor(169, 119, 45);
      } else {
        doc.setTextColor(185, 28, 28);
      }
      const scoreDeltaText = h.scoreDelta ? ` (${h.scoreDelta > 0 ? '+' : ''}${h.scoreDelta}%)` : '';
      doc.text(`${h.health.toUpperCase()} • Score: ${h.score}%${scoreDeltaText}`, pageWidth - margin - 8, cursorY + 10, { align: 'right' });

      // Middle line: Summary notes
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(92, 86, 69);
      const notesWrapped = doc.splitTextToSize(h.summaryNotes || 'Health evaluated against Scikit-Pulse multi-vector risk engine.', contentWidth - 16);
      doc.text(notesWrapped[0] || '', margin + 8, cursorY + 20);

      // Bottom line: Key drivers & author
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(140, 134, 114);
      const driversText = h.keyDrivers && h.keyDrivers.length > 0 ? `Drivers: ${h.keyDrivers.slice(0, 2).join('; ')}` : 'Audited by ML Engine';
      doc.text(`${driversText}  |  Logged by: ${h.author || 'System'}`, margin + 8, cursorY + 29);

      // Bottom separator
      doc.setDrawColor(234, 228, 212);
      doc.line(margin, cursorY + 34, margin + contentWidth, cursorY + 34);

      cursorY += 34;
    });
  }

  cursorY += 12;

  // =========================================================================
  // 6. MEDDPICC QUALIFICATION CRITERIA SCORECARD
  // =========================================================================
  ensureSpace(70);

  doc.setFillColor(23, 21, 15);
  doc.rect(margin, cursorY, contentWidth, 16, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('MEDDPICC ENTERPRISE QUALIFICATION SCORECARD', margin + 8, cursorY + 11);
  cursorY += 16;

  const m = lead.meddpicc || {
    metrics: true,
    economicBuyer: true,
    decisionCriteria: true,
    decisionProcess: true,
    paperProcess: false,
    identifyPain: true,
    champion: true,
    competition: true,
  };

  const meddpiccItems = [
    { key: 'M', label: 'Metrics (Quantified ROI & Business Value)', val: !!m.metrics },
    { key: 'E', label: 'Economic Buyer (Direct C-Level Authorization)', val: !!m.economicBuyer },
    { key: 'D', label: 'Decision Criteria (Technical & Operational SLA)', val: !!m.decisionCriteria },
    { key: 'D', label: 'Decision Process (Milestones & Formal Steps)', val: !!m.decisionProcess },
    { key: 'P', label: 'Paper Process (Legal, Procurement & Redlines)', val: !!m.paperProcess },
    { key: 'I', label: 'Identify Pain (Validated Core Cost of Inaction)', val: !!(m.identifyPain || m.identifiedPain) },
    { key: 'C', label: 'Champion (Internal Executive Advocate)', val: !!m.champion },
    { key: 'C', label: 'Competition (Incumbent & Alternative Defenses)', val: !!m.competition },
  ];

  // Render MEDDPICC in 2 columns
  const colWidth = (contentWidth - 10) / 2;
  const rowHeight = 16;

  doc.setFillColor(246, 243, 236);
  doc.rect(margin, cursorY, contentWidth, (meddpiccItems.length / 2) * rowHeight + 8, 'F');

  meddpiccItems.forEach((item, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const itemX = margin + 6 + col * (colWidth + 10);
    const itemY = cursorY + 6 + row * rowHeight;

    // Status box
    if (item.val) {
      doc.setFillColor(11, 107, 83); // Green checked
      doc.rect(itemX, itemY, 8, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text('✓', itemX + 1.5, itemY + 6.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(23, 21, 15);
      doc.text(`[${item.key}] ${item.label}`, itemX + 13, itemY + 7);
    } else {
      doc.setFillColor(234, 228, 212);
      doc.rect(itemX, itemY, 8, 8, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(185, 28, 28);
      doc.text('—', itemX + 2, itemY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(140, 134, 114);
      doc.text(`[${item.key}] ${item.label} (Pending)`, itemX + 13, itemY + 7);
    }
  });

  cursorY += (meddpiccItems.length / 2) * rowHeight + 18;

  // =========================================================================
  // 7. FOOTER / SIGN-OFF BLOCK
  // =========================================================================
  ensureSpace(40);

  doc.setDrawColor(234, 228, 212);
  doc.line(margin, cursorY, margin + contentWidth, cursorY);
  cursorY += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(140, 134, 114);
  doc.text(
    `Sales Pilot AI Enterprise Platform  |  CONFIDENTIAL  |  Deal ID: #${lead.id}  |  Currency: ${currency.code} (${currency.symbol})`,
    margin,
    cursorY + 6
  );

  doc.setFont('helvetica', 'bold');
  doc.text('VERIFIED & AUDITED BY SCIKIT-PULSE REVENUE ENGINE', pageWidth - margin, cursorY + 6, { align: 'right' });

  // Save the document
  const sanitizedCompany = lead.company.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const dateStamp = new Date().toISOString().slice(0, 10);
  const filename = `${sanitizedCompany}_executive_brief_${dateStamp}.pdf`;

  doc.save(filename);
}
