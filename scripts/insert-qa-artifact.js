/**
 * Script to insert QA artifact via HAL API endpoint.
 * Usage: node scripts/insert-qa-artifact.js <ticket-id> <hal-api-url>
 * 
 * Example: node scripts/insert-qa-artifact.js AGENTS-0002 http://localhost:5173
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function insertQaArtifact(ticketId, halApiUrl) {
  // Read the QA report
  const reportPath = path.join(__dirname, '..', 'docs', 'audit', ticketId, 'qa-report.md');
  let bodyMd;
  try {
    bodyMd = await fs.readFile(reportPath, 'utf8');
  } catch (err) {
    console.error(`Failed to read QA report from ${reportPath}:`, err.message);
    process.exit(1);
  }

  const title = `QA Report for ticket ${ticketId}`;
  
  const requestBody = {
    ticketId: ticketId,
    title: title,
    body_md: bodyMd,
  };

  console.log(`Calling ${halApiUrl}/api/artifacts/insert-qa`);
  console.log(`Ticket ID: ${ticketId}`);
  console.log(`Title: ${title}`);
  console.log(`Body length: ${bodyMd.length} characters\n`);

  try {
    const response = await fetch(`${halApiUrl}/api/artifacts/insert-qa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    
    if (!response.ok || !result.success) {
      console.error('Failed to insert QA artifact:');
      console.error('Status:', response.status, response.statusText);
      console.error('Error:', result.error || 'Unknown error');
      console.error('Response:', JSON.stringify(result, null, 2));
      process.exit(1);
    }

    console.log('✅ Successfully inserted QA artifact!');
    console.log('Artifact ID:', result.artifact_id);
    console.log('Action:', result.action);
    console.log('\nArtifact should now be visible in HAL UI Artifacts panel.');
    
    return result;
  } catch (err) {
    console.error('Error calling HAL API:');
    console.error(err.message);
    if (err.cause) {
      console.error('Cause:', err.cause);
    }
    process.exit(1);
  }
}

// Parse command line arguments
const ticketId = process.argv[2];
const halApiUrl = process.argv[3] || process.env.HAL_API_URL || 'http://localhost:5173';

if (!ticketId) {
  console.error('Usage: node scripts/insert-qa-artifact.js <ticket-id> [hal-api-url]');
  console.error('Example: node scripts/insert-qa-artifact.js AGENTS-0002 http://localhost:5173');
  process.exit(1);
}

insertQaArtifact(ticketId, halApiUrl).catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
