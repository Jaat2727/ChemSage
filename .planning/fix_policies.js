const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'supabase', 'migrations', '20260604_001_complete_schema_fix.sql');
let sql = fs.readFileSync(filePath, 'utf8');

// Regex to find CREATE POLICY "name" ON schema.table
const policyRegex = /CREATE POLICY\s+"([^"]+)"\s+ON\s+([^\s]+)\s+/gi;
sql = sql.replace(policyRegex, (match, policyName, tableName) => {
  return `DROP POLICY IF EXISTS "${policyName}" ON ${tableName};\n${match}`;
});

// Regex to find CREATE TRIGGER name AFTER/BEFORE ON schema.table
const triggerRegex = /CREATE TRIGGER\s+([^\s]+)\s+(?:BEFORE|AFTER)\s+(?:INSERT|UPDATE|DELETE)\s+ON\s+([^\s]+)\s+/gi;
sql = sql.replace(triggerRegex, (match, triggerName, tableName) => {
  return `DROP TRIGGER IF EXISTS ${triggerName} ON ${tableName};\n${match}`;
});

fs.writeFileSync(filePath, sql, 'utf8');
console.log('Fixed policies and triggers in schema fix file to be idempotent.');
