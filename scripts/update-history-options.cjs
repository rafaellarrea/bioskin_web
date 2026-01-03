const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/admin/ficha-clinica/data/history_options.json');

try {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Iterate over each category and add "Ninguno" or "Ningún medicamento"
  for (const key in data) {
    if (Array.isArray(data[key])) {
      let optionToAdd = "Ninguno";
      
      if (key.includes('medicamento') || key.includes('farmaco')) {
        optionToAdd = "Ningún medicamento";
      } else if (key.includes('alergia')) {
        optionToAdd = "Ninguna alergia conocida";
      } else if (key.includes('cirugia') || key.includes('quirurgico')) {
        optionToAdd = "Ninguna cirugía previa";
      } else if (key.includes('rutina')) {
        optionToAdd = "Ninguna rutina establecida"; // Already exists in some, but good to ensure
      }

      // Check if it already exists (case insensitive)
      const exists = data[key].some(item => item.toLowerCase() === optionToAdd.toLowerCase());
      
      if (!exists) {
        // Add to the beginning of the array
        data[key].unshift(optionToAdd);
        console.log(`Added "${optionToAdd}" to ${key}`);
      } else {
          console.log(`"${optionToAdd}" already exists in ${key}`);
      }
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log('Successfully updated history_options.json');

} catch (err) {
  console.error('Error updating file:', err);
}
