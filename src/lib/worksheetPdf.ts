import { renderPdf, PAGE_WIDTH, PAGE_HEIGHT, type PdfItem, type PdfPage } from './pdf';
import { isAnswerCorrect, worksheetScore, WRITING_COLUMNS, type Stroke, type Worksheet } from './worksheet';
import { TRIMESTER_LABELS } from '../types';
import { wrapAppreciation } from './correction';

const MARGIN = 40;
const COLUMNS = 2;
const ROWS = 3;
const PER_PAGE = COLUMNS * ROWS;

const BOX_WIDTH = (PAGE_WIDTH - MARGIN * 2 - 19) / COLUMNS;
const BOX_HEIGHT = (BOX_WIDTH * 3) / 4;
const STATEMENT_HEIGHT = 18;
const ANSWER_HEIGHT = 20;
const ROW_HEIGHT = STATEMENT_HEIGHT + BOX_HEIGHT + ANSWER_HEIGHT + 12;

const INK = 0.1;
const TEACHER_RED: [number, number, number] = [0.85, 0.15, 0.15];
const CORRECT_GREEN: [number, number, number] = [0.13, 0.6, 0.35];

export function formatFrenchDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** Le quadrillage du cahier : c'est lui qui permet d'aligner les chiffres,
 *  donc il doit se retrouver à l'identique sur le papier. */
function gridItems(x: number, y: number): PdfItem[] {
  const step = BOX_WIDTH / WRITING_COLUMNS;
  const items: PdfItem[] = [
    { kind: 'rect', x, y, width: BOX_WIDTH, height: BOX_HEIGHT, strokeGray: 0.6, lineWidth: 0.8 },
  ];
  for (let column = 1; column * step < BOX_WIDTH; column++) {
    items.push({
      kind: 'polyline',
      points: [
        [x + column * step, y],
        [x + column * step, y + BOX_HEIGHT],
      ],
      width: 0.3,
      gray: 0.82,
    });
  }
  for (let row = 1; row * step < BOX_HEIGHT; row++) {
    items.push({
      kind: 'polyline',
      points: [
        [x, y + row * step],
        [x + BOX_WIDTH, y + row * step],
      ],
      width: 0.3,
      gray: 0.82,
    });
  }
  return items;
}

function strokeItems(
  strokes: Stroke[],
  x: number,
  y: number,
  options: { rgb?: [number, number, number]; width: number }
): PdfItem[] {
  return strokes
    .filter((stroke) => stroke.points.length > 0)
    .map((stroke) => ({
      kind: 'polyline' as const,
      points: stroke.points.map(
        ([px, py]) => [x + px * BOX_WIDTH, y + py * BOX_HEIGHT] as [number, number]
      ),
      width: options.width,
      gray: options.rgb ? undefined : INK,
      rgb: options.rgb,
    }));
}

/** Une coche et une croix dessinées au trait : la police standard d'un PDF
 *  n'a ni l'une ni l'autre. */
function verdictMark(x: number, y: number, correct: boolean): PdfItem[] {
  if (correct) {
    return [
      {
        kind: 'polyline',
        points: [
          [x, y + 4],
          [x + 3.5, y + 8],
          [x + 10, y - 2],
        ],
        width: 2,
        rgb: CORRECT_GREEN,
      },
    ];
  }
  return [
    {
      kind: 'polyline',
      points: [
        [x, y - 2],
        [x + 9, y + 8],
      ],
      width: 2,
      rgb: TEACHER_RED,
    },
    {
      kind: 'polyline',
      points: [
        [x + 9, y - 2],
        [x, y + 8],
      ],
      width: 2,
      rgb: TEACHER_RED,
    },
  ];
}

/** Une ligne d'appréciation : assez courte pour tenir sur la page même écrite
 *  en capitales, après l'intitulé. */
const APPRECIATION_LINE_LENGTH = 56;
const APPRECIATION_LINE_HEIGHT = 15;

export function worksheetToPdfPages(worksheet: Worksheet): PdfPage[] {
  const { correct, total } = worksheetScore(worksheet);
  const pageCount = Math.max(1, Math.ceil(worksheet.operations.length / PER_PAGE));
  const appreciation = wrapAppreciation(worksheet.appreciation ?? '', APPRECIATION_LINE_LENGTH);

  return Array.from({ length: pageCount }, (_, pageIndex) => {
    // L'appréciation de la maîtresse s'écrit sous le nom, sur la première
    // page ; les opérations descendent d'autant.
    const notes = pageIndex === 0 ? appreciation : [];
    const separatorY = notes.length === 0 ? 86 : 94 + notes.length * APPRECIATION_LINE_HEIGHT;
    const headerHeight = separatorY + 10;
    const items: PdfItem[] = [
      { kind: 'text', x: MARGIN, y: 56, size: 20, text: 'Opérations posées', bold: true },
      {
        kind: 'text',
        x: MARGIN,
        y: 76,
        size: 11,
        gray: 0.35,
        text: [
          worksheet.name || 'Élève',
          worksheet.level,
          TRIMESTER_LABELS[worksheet.trimester],
          formatFrenchDate(worksheet.createdAt),
        ].join('  ·  '),
      },
      {
        kind: 'text',
        x: PAGE_WIDTH - MARGIN,
        y: 56,
        size: 14,
        align: 'right',
        text: `${correct} / ${total}`,
        bold: true,
      },
      {
        kind: 'text',
        x: PAGE_WIDTH - MARGIN,
        y: 76,
        size: 10,
        gray: 0.45,
        align: 'right',
        text: 'École Arc-en-Ciel',
      },
      {
        kind: 'polyline',
        points: [
          [MARGIN, separatorY],
          [PAGE_WIDTH - MARGIN, separatorY],
        ],
        width: 0.8,
        gray: 0.75,
      },
      ...notes.flatMap((line, index): PdfItem[] => {
        const y = 98 + index * APPRECIATION_LINE_HEIGHT;
        return [
          ...(index === 0
            ? [{ kind: 'text', x: MARGIN, y, size: 11, bold: true, rgb: TEACHER_RED, text: 'Appréciation :' } as PdfItem]
            : []),
          { kind: 'text', x: MARGIN + 84, y, size: 11, rgb: TEACHER_RED, text: line },
        ];
      }),
    ];

    if (pageCount > 1) {
      items.push({
        kind: 'text',
        x: PAGE_WIDTH / 2,
        y: PAGE_HEIGHT - 24,
        size: 9,
        gray: 0.5,
        align: 'center',
        text: `page ${pageIndex + 1} sur ${pageCount}`,
      });
    }

    worksheet.operations
      .slice(pageIndex * PER_PAGE, (pageIndex + 1) * PER_PAGE)
      .forEach((operation, index) => {
        const column = index % COLUMNS;
        const row = Math.floor(index / COLUMNS);
        const x = MARGIN + column * (BOX_WIDTH + 19);
        const top = headerHeight + row * ROW_HEIGHT;
        const boxY = top + STATEMENT_HEIGHT;

        const answer = worksheet.answers[operation.id];
        const given = answer?.given ?? '';
        const isCorrect = isAnswerCorrect(given, operation.expected);

        items.push(
          { kind: 'text', x, y: top + 12, size: 13, bold: true, text: operation.statement },
          ...gridItems(x, boxY),
          ...strokeItems(answer?.strokes ?? [], x, boxY, { width: 1.6 }),
          ...strokeItems(answer?.teacherStrokes ?? [], x, boxY, { rgb: TEACHER_RED, width: 2 })
        );

        const answerY = boxY + BOX_HEIGHT + 15;
        if (given === '') {
          items.push({
            kind: 'text',
            x,
            y: answerY,
            size: 11,
            gray: 0.5,
            text: 'Pas de réponse',
          });
        } else {
          items.push(
            { kind: 'text', x, y: answerY, size: 11, gray: 0.35, text: 'Réponse :' },
            { kind: 'text', x: x + 52, y: answerY, size: 12, bold: true, text: given },
            ...verdictMark(x + 52 + given.length * 7 + 8, answerY - 4, isCorrect)
          );
          if (!isCorrect) {
            items.push({
              kind: 'text',
              x: x + BOX_WIDTH,
              y: answerY,
              size: 10,
              gray: 0.45,
              align: 'right',
              text: `attendu : ${operation.expected}`,
            });
          }
        }
      });

    return { items };
  });
}

export function worksheetToPdf(worksheet: Worksheet): Uint8Array {
  return renderPdf(worksheetToPdfPages(worksheet), {
    title: `Opérations posées — ${worksheet.name || 'élève'}`,
    author: 'École Arc-en-Ciel',
  });
}

export function worksheetFileName(worksheet: Worksheet): string {
  const slug = (worksheet.name || 'eleve')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  const date = formatFrenchDate(worksheet.createdAt).split('/').reverse().join('-');
  const corrected =
    Boolean(worksheet.appreciation) ||
    worksheet.operations.some((operation) => (worksheet.answers[operation.id]?.teacherStrokes ?? []).length > 0);
  return `operations-posees-${slug || 'eleve'}-${date}${corrected ? '-corrigee' : ''}.pdf`;
}
