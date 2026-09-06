const fs = require('fs');
const path = require('path');
const config = require('../config');

// Simple PDF generator stub: writes a basic HTML file or a plain .pdf-like file to uploads/
// For production replace with Puppeteer or a PDF library and S3 upload.
async function generatePdf(resume) {
  const uploads = config.uploadsDir || path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploads)) fs.mkdirSync(uploads, { recursive: true });
  const filename = `resume-${resume.userId}-${resume._id}.pdf`;
  const filepath = path.join(uploads, filename);
  const content = `Title: ${resume.title}\n\nData: ${JSON.stringify(resume.data, null, 2)}`;
  // Write plain text to .pdf filename as a simple placeholder
  fs.writeFileSync(filepath, content, 'utf8');
  // Return a local path (not a public URL). For production, upload to S3 and return URL.
  return `/uploads/${filename}`;
}

module.exports = { generatePdf };
