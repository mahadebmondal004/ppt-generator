const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType, Header, Footer, PageNumber,
  NumberFormat, convertInchesToTwip
} = require('docx');

const buildLessonPlanDoc = async (config, lessonPlan) => {
  const {
    board, grade, subject, topic, subTopics,
    classDuration, slideCount, difficultyLevel
  } = config;

  const subTopicsList = subTopics && subTopics.length > 0 ? subTopics.join(', ') : 'All sub-topics';

  const makeHeading = (text, level = HeadingLevel.HEADING_2) => new Paragraph({
    text,
    heading: level,
    spacing: { before: 300, after: 100 },
    thematicBreak: level === HeadingLevel.HEADING_1
  });

  const makeParagraph = (text) => new Paragraph({
    children: [new TextRun({ text, size: 24, font: 'Calibri' })],
    spacing: { after: 100 }
  });

  const makeBullet = (text) => new Paragraph({
    children: [new TextRun({ text, size: 22, font: 'Calibri' })],
    bullet: { level: 0 },
    spacing: { after: 60 }
  });

  const makeLabelValue = (label, value) => new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 22, font: 'Calibri' }),
      new TextRun({ text: value || '—', size: 22, font: 'Calibri' })
    ],
    spacing: { after: 80 }
  });

  // Build table rows for duration map
  const durationRows = (lessonPlan.durationMap || []).map(item =>
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: item.phase, bold: true, size: 20 })] })],
          shading: { type: ShadingType.SOLID, color: 'E8EAF6' },
          width: { size: 70, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: `${item.minutes} min`, size: 20 })] })],
          width: { size: 30, type: WidthType.PERCENTAGE }
        })
      ]
    })
  );

  const doc = new Document({
    sections: [{
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: `${board} | ${grade} | ${subject} — Lesson Plan`, bold: true, size: 18, color: '4F46E5' })
              ],
              alignment: AlignmentType.RIGHT,
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '4F46E5' } }
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'AI Teacher PPT Generator  |  Page ', size: 16 }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16 }),
                new TextRun({ text: ' of ', size: 16 }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16 })
              ],
              alignment: AlignmentType.CENTER
            })
          ]
        })
      },
      children: [
        // Title
        new Paragraph({
          children: [
            new TextRun({ text: `Lesson Plan`, bold: true, size: 52, color: '4F46E5', font: 'Calibri' })
          ],
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: topic, bold: true, size: 36, color: '0F172A', font: 'Calibri' })
          ],
          spacing: { after: 400 }
        }),

        // Metadata block
        makeLabelValue('Board', board),
        makeLabelValue('Grade', grade),
        makeLabelValue('Subject', subject),
        makeLabelValue('Topic', topic),
        makeLabelValue('Sub-Topics', subTopicsList),
        makeLabelValue('Class Duration', `${classDuration} minutes`),
        makeLabelValue('Number of Slides', slideCount?.toString()),
        makeLabelValue('Difficulty Level', difficultyLevel || 'Intermediate'),

        new Paragraph({ text: '', spacing: { after: 200 } }),

        // Learning Objectives
        makeHeading('1. Learning Objectives', HeadingLevel.HEADING_2),
        ...(lessonPlan.learningObjectives || []).map(obj => makeBullet(obj)),

        // Prior Knowledge
        makeHeading('2. Prior Knowledge Required', HeadingLevel.HEADING_2),
        makeParagraph(lessonPlan.priorKnowledge || ''),

        // Hook
        makeHeading('3. Introduction / Hook', HeadingLevel.HEADING_2),
        makeParagraph(lessonPlan.hook || ''),

        // Teaching Activities
        makeHeading('4. Main Teaching Activities', HeadingLevel.HEADING_2),
        ...(lessonPlan.teachingActivities || []).map(act => makeBullet(act)),

        // Student Activities
        makeHeading('5. Student Activities', HeadingLevel.HEADING_2),
        ...(lessonPlan.studentActivities || []).map(act => makeBullet(act)),

        // Assessment
        makeHeading('6. Assessment / Check for Understanding', HeadingLevel.HEADING_2),
        makeParagraph(lessonPlan.assessment || ''),

        // Resources
        makeHeading('7. Resources Required', HeadingLevel.HEADING_2),
        ...(lessonPlan.resources || []).map(r => makeBullet(r)),

        // Homework
        makeHeading('8. Homework / Extension', HeadingLevel.HEADING_2),
        makeParagraph(lessonPlan.homework || ''),

        // Duration Map Table
        makeHeading('9. Lesson Duration Map', HeadingLevel.HEADING_2),
        ...(durationRows.length > 0 ? [
          new Table({
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Phase', bold: true, size: 22, color: 'FFFFFF' })] })],
                    shading: { type: ShadingType.SOLID, color: '4F46E5' }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Duration', bold: true, size: 22, color: 'FFFFFF' })] })],
                    shading: { type: ShadingType.SOLID, color: '4F46E5' }
                  })
                ]
              }),
              ...durationRows
            ],
            width: { size: 100, type: WidthType.PERCENTAGE }
          })
        ] : [makeParagraph('Duration map not available.')])
      ]
    }]
  });

  return await Packer.toBuffer(doc);
};

module.exports = { buildLessonPlanDoc };
