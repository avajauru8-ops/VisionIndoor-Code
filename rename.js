import fs from 'fs';
import path from 'path';

function processDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.match(/\.(tsx|ts|jsx|js|html)$/)) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            if (content.includes('VisioIndoor')) {
                content = content.replaceAll('VisioIndoor', 'GrandMídia');
                modified = true;
            }
            if (content.includes('VISIOINDOOR')) {
                content = content.replaceAll('VISIOINDOOR', 'GRANDMÍDIA');
                modified = true;
            }
            if (content.includes('VISIO<span className="text-indigo-400">INDOR</span>')) {
                content = content.replaceAll('VISIO<span className="text-indigo-400">INDOR</span>', 'Grand<span className="text-indigo-400">Mídia</span>');
                modified = true;
            }
            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Renamed in', fullPath);
            }
        }
    }
}

processDir('src');
processDir('backend/public');
if (fs.existsSync('index.html')) {
    let content = fs.readFileSync('index.html', 'utf8');
    if (content.includes('VisioIndoor')) {
        content = content.replaceAll('VisioIndoor', 'GrandMídia');
        fs.writeFileSync('index.html', content, 'utf8');
        console.log('Renamed in index.html');
    }
}
console.log('Done');
