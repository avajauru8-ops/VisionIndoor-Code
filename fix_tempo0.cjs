const fs = require('fs');

const srcPath = 'C:\\Users\\Eber-ACS\\AndroidStudioProjects\\TotemPlayer\\app\\src\\main\\java\\com\\veerocket\\grandmidia\\MainActivity.java';
let code = fs.readFileSync(srcPath, 'utf8');

// Ensure tempoExibicao is not 0 or negative
const regex = /int tempoExibicao = item\.has\("tempo_exibicao"\) && !item\.isNull\("tempo_exibicao"\) \? item\.getInt\("tempo_exibicao"\) : defaultDisplayTime;/g;

const fixedMethod = `int tempoExibicao = item.has("tempo_exibicao") && !item.isNull("tempo_exibicao") ? item.getInt("tempo_exibicao") : defaultDisplayTime;
                        if (tempoExibicao <= 0) tempoExibicao = defaultDisplayTime;`;

code = code.replace(regex, fixedMethod);

fs.writeFileSync(srcPath, code, 'utf8');
console.log("Fixed tempoExibicao fallback");
