const fs = require('fs');
const path = require('path');

// Read services.ts content (simulated reading since it's a TS file and we are in JS)
// I will read the file content directly using fs
const servicesPath = path.join(__dirname, '..', 'src', 'data', 'services.ts');
const imagesDir = path.join(__dirname, '..', 'public', 'images', 'services');
const servicesContent = fs.readFileSync(servicesPath, 'utf8');

// Extract service IDs using regex
const idRegex = /"id":\s*"([^"]+)"/g;
let match;
const serviceIds = [];

while ((match = idRegex.exec(servicesContent)) !== null) {
    serviceIds.push(match[1]);
}

const existingFolders = fs.readdirSync(imagesDir).filter(file => {
    return fs.statSync(path.join(imagesDir, file)).isDirectory();
});

// Manual mapping of IDs to existing folders (based on what I just did)
const manualMapping = {
    'antiaging': 'antiaging',
    'exosomas': 'exosomas',
    'hidratacion-profunda': 'hidratacionProfunda',
    'hollywood-peel': 'hollywoodPeel',
    'limpieza-facial': 'limpiezaProf',
    'lipopapada': 'lipopapada',
    'antimanchas': 'manchas',
    'nctf': 'nctf',
    'remocion-tatuajes': 'remocionTatuajes',
    'ndyag-tattoo': 'remocionTatuajes' // Assuming this shares the folder
};

const missingServices = [];
const createdFolders = [];

serviceIds.forEach(id => {
    // Check if this ID is already mapped to an existing folder
    if (manualMapping[id]) {
        return;
    }

    // Check if a folder with the exact ID exists
    if (existingFolders.includes(id)) {
        return;
    }

    // If not, create it
    const newFolderPath = path.join(imagesDir, id);
    if (!fs.existsSync(newFolderPath)) {
        fs.mkdirSync(newFolderPath, { recursive: true });
        createdFolders.push(id);
        missingServices.push(id);
    }
});

console.log("Carpetas creadas para los siguientes servicios (sin imagen):");
missingServices.forEach(id => console.log(`- ${id}`));

// Update services.ts to point to these new folders?
// The user asked to "pon las imagenes que encuentres en el servicio correcto" (done)
// "crea cada carpeta para los servicios que no tienen imagen" (done above)
// "dame el listado de los servicios faltantes" (done above)

