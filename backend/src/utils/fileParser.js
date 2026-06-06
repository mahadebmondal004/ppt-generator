const fs = require('fs');
const path = require('path');

const parseFile = async (filePath, mimeType) => {
  try {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pdf') {
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text.substring(0, 8000); // Limit context
    }

    if (ext === '.docx') {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value.substring(0, 8000);
    }

    if (ext === '.txt') {
      return fs.readFileSync(filePath, 'utf8').substring(0, 8000);
    }

    if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
      return `[Image file uploaded: ${path.basename(filePath)}]`;
    }

    if (ext === '.pptx') {
      return `[PowerPoint file uploaded: ${path.basename(filePath)} — please refer to this presentation for context]`;
    }

    return '';
  } catch (error) {
    console.error(`Error parsing file ${filePath}:`, error.message);
    return '';
  }
};

const parseMultipleFiles = async (files) => {
  if (!files || files.length === 0) return '';

  const texts = [];
  for (const file of files) {
    const text = await parseFile(file.path, file.mimetype);
    if (text) {
      texts.push(`--- ${file.originalname} ---\n${text}`);
    }
  }

  return texts.join('\n\n').substring(0, 12000); // Total context limit
};

module.exports = { parseFile, parseMultipleFiles };
