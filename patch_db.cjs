const fs = require('fs');

const file = 'C:\\Users\\Eber-ACS\\AndroidStudioProjects\\TotemPlayer\\app\\src\\main\\java\\com\\veerocket\\grandmidia\\DatabaseHelper.java';
let content = fs.readFileSync(file, 'utf8');

// We want to remove device_id=null from clearAllData
content = content.replace(
    /UPDATE config SET device_id=null, rotacao='padrao'/g, 
    "UPDATE config SET rotacao='padrao'"
);

fs.writeFileSync(file, content, 'utf8');
console.log("DatabaseHelper.java patched!");
