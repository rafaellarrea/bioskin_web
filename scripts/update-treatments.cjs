const fs = require('fs');
const path = require('path');

// Read services.ts (we need to parse it manually or use a regex because it's TS)
// Since we can't easily execute TS here without compilation, we'll read it as text and extract the JSON-like structure or use regex.
// Actually, let's try to read it as a string and regex out the titles.

const servicesPath = path.join(__dirname, '../src/data/services.ts');
const treatmentsPath = path.join(__dirname, '../src/components/admin/ficha-clinica/data/treatments.json');

try {
  const servicesContent = fs.readFileSync(servicesPath, 'utf8');
  const treatmentsContent = JSON.parse(fs.readFileSync(treatmentsPath, 'utf8'));

  // Regex to find "title": "..."
  const titleRegex = /"title":\s*"([^"]+)"/g;
  let match;
  const serviceTitles = [];

  while ((match = titleRegex.exec(servicesContent)) !== null) {
    serviceTitles.push(match[1]);
  }

  console.log(`Found ${serviceTitles.length} services from website.`);

  // Get existing treatment names
  const existingTreatments = new Set(treatmentsContent.map(t => t.elemento));
  let addedCount = 0;
  let maxId = Math.max(...treatmentsContent.map(t => t.id), 0);

  serviceTitles.forEach(title => {
    if (!existingTreatments.has(title)) {
      maxId++;
      treatmentsContent.push({
        id: maxId,
        categoria: "Medicina Estética", // Default category
        elemento: title,
        descripcion: "Sincronizado desde Web",
        es_maestro: 1,
        activo: 1,
        creado_en: new Date().toISOString().replace('T', ' ').substring(0, 19),
        categoria_id: 2 // Assuming 2 is Medicina Estética based on previous file read
      });
      existingTreatments.add(title);
      addedCount++;
      console.log(`Added: ${title}`);
    }
  });

  if (addedCount > 0) {
    fs.writeFileSync(treatmentsPath, JSON.stringify(treatmentsContent, null, 2), 'utf8');
    console.log(`Successfully added ${addedCount} new treatments.`);
  } else {
    console.log('No new treatments to add.');
  }

} catch (err) {
  console.error('Error updating treatments:', err);
}
