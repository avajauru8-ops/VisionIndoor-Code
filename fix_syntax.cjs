const fs = require('fs');

const file = 'C:\\Users\\Eber-ACS\\AndroidStudioProjects\\TotemPlayer\\app\\src\\main\\java\\com\\veerocket\\grandmidia\\MainActivity.java';
let content = fs.readFileSync(file, 'utf8');

// The faulty string is: "} else boolean useOnline = isInternetAvailable();" with possible whitespaces
content = content.replace(/\} else\s+boolean useOnline = isInternetAvailable\(\);/, '} else {\n            boolean useOnline = isInternetAvailable();');

// We also need to add a closing brace '}' at the end of the new else block.
// The newPlayMedia block ended with:
/*
                    if (imageRunnable != null) mainHandler.removeCallbacks(imageRunnable);
                    imageRunnable = this::playNextMedia;
                    mainHandler.postDelayed(imageRunnable, item.tempoExibicao * 1000L);
                }
            }
*/
// Actually, let's just do a clean replace using the unique `boolean useOnline = isInternetAvailable();`
// We will replace the entire `if ... else boolean ...` with a properly braced `else { ... }`.

// Let's first read exactly what's there
const lines = content.split('\n');
let fixedLines = [];
let addedBrace = false;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.includes('} else') && lines[i+1] && lines[i+1].includes('boolean useOnline = isInternetAvailable();')) {
        fixedLines.push(line + ' {');
        addedBrace = true;
    } 
    else if (line.includes('} else boolean useOnline = isInternetAvailable();')) {
        fixedLines.push(line.replace('} else boolean', '} else { boolean'));
        addedBrace = true;
    }
    else {
        fixedLines.push(line);
    }
}

content = fixedLines.join('\n');

// If we added an opening brace, we need to add a closing brace at the end of the playMedia function.
// Let's find the end of playMedia.
if (addedBrace) {
    // The playMedia function has a catch block
    // } catch (Exception e) {
    const catchIndex = content.lastIndexOf('} catch (Exception e) {');
    if (catchIndex !== -1) {
        // Insert a closing brace before the catch block
        content = content.substring(0, catchIndex) + '            }\n        ' + content.substring(catchIndex);
    }
}

fs.writeFileSync(file, content, 'utf8');
console.log('Syntax error fixed!');
