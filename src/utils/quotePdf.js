import { formatPEN } from './formatPEN';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const LEFT = 14;
const RIGHT = 196;
const CONTENT_BOTTOM = 260;
const COLUMN = { number: 16, description: 29, quantity: 132, price: 160, subtotal: 194 };

function drawHeader(doc, viewModel) {
  doc.setFillColor(10, 37, 64);
  doc.rect(0, 0, PAGE_WIDTH, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('K', LEFT, 19);
  doc.setFontSize(12);
  doc.text(viewModel.company.name.toUpperCase(), 25, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`RUC ${viewModel.company.ruc} · ${viewModel.company.phone}`, 25, 20);
  doc.text(viewModel.company.address, 25, 26);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('PROFORMA REFERENCIAL', LEFT, 45);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Código: ${viewModel.code}`, LEFT, 52);
  doc.text(`Emisión: ${viewModel.issuedAt ? new Date(viewModel.issuedAt).toLocaleString('es-PE') : '—'}`, LEFT, 58);
  doc.text(`Válida hasta: ${viewModel.validUntil ? new Date(viewModel.validUntil).toLocaleString('es-PE', { timeZone: 'America/Lima' }) : '—'} (Lima)`, LEFT, 64);
  if (viewModel.status === 'vencida') {
    doc.setDrawColor(148, 163, 184);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text('VENCIDA', RIGHT, 45, { align: 'right' });
    doc.setTextColor(30, 41, 59);
  }
}

function drawTableHeader(doc, y) {
  doc.setFillColor(241, 245, 249);
  doc.rect(LEFT, y - 5, RIGHT - LEFT, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('N°', COLUMN.number, y, { align: 'right' });
  doc.text('Descripción', COLUMN.description, y);
  doc.text('Cant.', COLUMN.quantity, y, { align: 'right' });
  doc.text('P. unit.', COLUMN.price, y, { align: 'right' });
  doc.text('Subtotal', COLUMN.subtotal, y, { align: 'right' });
  doc.setDrawColor(203, 213, 225);
  doc.line(LEFT, y + 5, RIGHT, y + 5);
  doc.setTextColor(30, 41, 59);
  return y + 11;
}

function drawFooter(doc, pageCount) {
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(226, 232, 240);
    doc.line(LEFT, PAGE_HEIGHT - 14, RIGHT, PAGE_HEIGHT - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Página ${page} de ${pageCount}`, RIGHT, PAGE_HEIGHT - 8, { align: 'right' });
  }
  doc.setTextColor(30, 41, 59);
}

function drawTotals(doc, viewModel, y) {
  const requiredHeight = 46 + (viewModel.unavailableItems.length ? 18 : 0);
  if (y + requiredHeight > CONTENT_BOTTOM) {
    doc.addPage();
    drawHeader(doc, viewModel);
    y = drawTableHeader(doc, 76);
  }
  const left = 112;
  doc.setDrawColor(203, 213, 225);
  doc.line(left, y, RIGHT, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Subtotal', left, y);
  doc.text(formatPEN(viewModel.totals.subtotal), RIGHT, y, { align: 'right' });
  y += 6;
  doc.text('IGV (18%)', left, y);
  doc.text(formatPEN(viewModel.totals.tax), RIGHT, y, { align: 'right' });
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Total de los productos con precio', left, y);
  doc.text(formatPEN(viewModel.totals.total), RIGHT, y, { align: 'right' });
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  if (viewModel.totals.includesTax) {
    doc.text('Los precios unitarios incluyen IGV', left, y);
    y += 5;
  }
  doc.text(`Ítems sin cotizar: ${viewModel.totals.unquotedCount}`, left, y);
  return y + 8;
}

export function renderQuotePdf(doc, viewModel) {
  drawHeader(doc, viewModel);
  let y = drawTableHeader(doc, 76);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  viewModel.pricedItems.forEach((item) => {
    const descriptionLines = doc.splitTextToSize(item.description, 96);
    const attributeLines = item.attributeLine
      ? doc.splitTextToSize(item.attributeLine, 96)
      : [];
    const noteLines = item.equivalenceNote
      ? doc.splitTextToSize(item.equivalenceNote, 96)
      : [];
    const rowHeight = Math.max(
      10,
      descriptionLines.length * 4 + attributeLines.length * 3.5 + noteLines.length * 3.5 + 2,
    );
    if (y + rowHeight > CONTENT_BOTTOM) {
      doc.addPage();
      drawHeader(doc, viewModel);
      y = drawTableHeader(doc, 76);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }

    doc.setTextColor(71, 85, 105);
    doc.text(String(item.number), COLUMN.number, y, { align: 'right' });
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(descriptionLines, COLUMN.description, y);
    doc.setFont('helvetica', 'normal');
    let detailY = y + descriptionLines.length * 4;
    if (attributeLines.length) {
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(7);
      doc.text(attributeLines, COLUMN.description, detailY);
      detailY += attributeLines.length * 3.5;
    }
    if (noteLines.length) {
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.text(noteLines, COLUMN.description, detailY);
    }
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(`${item.quantity}${item.unit ? ` ${item.unit}` : ''}`, COLUMN.quantity, y, { align: 'right' });
    doc.text(formatPEN(item.unitPrice), COLUMN.price, y, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatPEN(item.lineSubtotal), COLUMN.subtotal, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setDrawColor(226, 232, 240);
    doc.line(LEFT, y + rowHeight - 2, RIGHT, y + rowHeight - 2);
    y += rowHeight;
  });

  if (viewModel.unavailableItems.length) {
    if (y + 22 > CONTENT_BOTTOM) {
      doc.addPage();
      drawHeader(doc, viewModel);
      y = drawTableHeader(doc, 76);
    }
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Productos sin stock o no disponibles', LEFT, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    viewModel.unavailableItems.forEach((item) => {
      const title = `${item.number}. ${item.description}`;
      const titleLines = doc.splitTextToSize(title, 170);
      const alternative = item.alternative
        ? doc.splitTextToSize(`Alternativa disponible: ${item.alternative}`, 165)
        : [];
      const height = titleLines.length * 4 + alternative.length * 3.5 + 3;
      if (y + height > CONTENT_BOTTOM) {
        doc.addPage();
        drawHeader(doc, viewModel);
        y = 52;
      }
      doc.setTextColor(71, 85, 105);
      doc.text(titleLines, LEFT, y);
      y += titleLines.length * 4;
      if (alternative.length) {
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(7);
        doc.text(alternative, LEFT + 4, y);
        doc.setFontSize(8);
        y += alternative.length * 3.5;
      }
      y += 3;
    });
  }

  y = drawTotals(doc, viewModel, y);
  const noticeLines = doc.splitTextToSize(viewModel.validityNotice, 176);
  const noticeHeight = noticeLines.length * 4 + 8;
  if (y + noticeHeight > CONTENT_BOTTOM) {
    doc.addPage();
    drawHeader(doc, viewModel);
    y = 76;
  }
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(LEFT, y, RIGHT - LEFT, noticeHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(noticeLines, LEFT + 4, y + 6);
  drawFooter(doc, doc.getNumberOfPages());
}
