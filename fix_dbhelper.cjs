const fs = require('fs');

const file = 'C:\\Users\\Eber-ACS\\AndroidStudioProjects\\TotemPlayer\\app\\src\\main\\java\\com\\veerocket\\grandmidia\\DatabaseHelper.java';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /playlist\.add\(new MainActivity\.MediaItem\(tipo, caminhoLocal, tempoExibicao\)\);/g,
    'playlist.add(new MainActivity.MediaItem(tipo, caminhoLocal, null, tempoExibicao));'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed DatabaseHelper.java!');
