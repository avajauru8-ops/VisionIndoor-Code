const fs = require('fs');

const file = 'C:\\Users\\Eber-ACS\\AndroidStudioProjects\\TotemPlayer\\app\\src\\main\\java\\com\\veerocket\\grandmidia\\MainActivity.java';
let content = fs.readFileSync(file, 'utf8');

const search = `        return info;

    private long getFolderSize(File f) {`;

const replace = `        return info;
    }

    private long getFolderSize(File f) {`;

content = content.replace(search, replace);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed missing brace!');
