
import papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_CSV_PATH = path.join(__dirname, '../csv/rotten-tomatoes.programs.updated.csv');
const OUTPUT_CSV_PATH = path.join(__dirname, '../csv/programs-for-import.csv');

const requirementColumns = [
  'ielts', 'portfolio', 'toefl', 'gre', 'otherTests',
  'gpa', 'classSize', 'difficulty', 'rating'
];

// Columns to keep in the final CSV, in the correct order for the database
const finalColumns = [
  'name', 'initial', 'school_id', 'degree', 'website_url',
  'duration_years', 'currency', 'total_tuition', 'is_stem',
  'description', 'requirements'
  // created_by and created_at will be handled by the database
];


async function main() {
  try {
    console.log('Starting script to prepare programs CSV for import...');

    // 1. Read the input CSV file
    const programsCsvFile = fs.readFileSync(INPUT_CSV_PATH, 'utf8');
    const programsData = papa.parse(programsCsvFile, { header: true, skipEmptyLines: true }).data;
    console.log(`Read ${programsData.length} programs from the input file.`);

    // 2. Process each row
    const processedPrograms = programsData.map(program => {
      const newProgram = {};
      const requirements = {};

      // Map and rename columns
      newProgram.name = program.name;
      newProgram.initial = program.initial;
      newProgram.school_id = program.school_id;
      newProgram.degree = program.degree;
      newProgram.website_url = program.website_url;
      newProgram.duration_years = program.length;
      newProgram.currency = program.currency;
      newProgram.total_tuition = program.total_tuition;
      newProgram.is_stem = program.is_stem === 'Y'; // Convert to boolean
      newProgram.description = program.description;

      // Consolidate requirement fields into a JSON object
      for (const col of requirementColumns) {
        if (program[col] && program[col].trim() !== '') {
            // Special handling for portfolio (Y/N to boolean)
            if (col === 'portfolio') {
                requirements[col] = program[col].trim().toUpperCase() === 'Y';
            } else {
                 requirements[col] = program[col];
            }
        }
      }
      newProgram.requirements = JSON.stringify(requirements);
      
      // Filter to only include final columns
      const finalProgramObject = {};
      for(const col of finalColumns) {
          finalProgramObject[col] = newProgram[col];
      }

      return finalProgramObject;
    });

    // 3. Convert back to CSV and write to output file
    const updatedCsv = papa.unparse(processedPrograms, {
        columns: finalColumns // Ensure header order is correct
    });
    fs.writeFileSync(OUTPUT_CSV_PATH, updatedCsv);

    console.log(`\n✅ Successfully prepared the CSV for import!`);
    console.log(`The new file is located at: ${OUTPUT_CSV_PATH}`);
    console.log(`\nNext steps:`);
    console.log(`1. Apply the new migration to your Supabase database.`);
    console.log(`2. Clear the existing data from your 'programs' table.`);
    console.log(`3. Import '${path.basename(OUTPUT_CSV_PATH)}' into your 'programs' table.`);

  } catch (error) {
    console.error(`\n❌ An error occurred: ${error.message}`);
    process.exit(1);
  }
}

main();
