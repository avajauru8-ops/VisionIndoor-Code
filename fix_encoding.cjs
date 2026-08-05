const fs = require('fs');
const path = require('path');

function fixString(str) {
    try {
        // Convert the string into a buffer assuming each char code is a byte
        const buf = Buffer.alloc(str.length);
        for (let i = 0; i < str.length; i++) {
            let code = str.charCodeAt(i);
            if (code > 255) {
                switch(code) {
                    case 0x20AC: code = 0x80; break;
                    case 0x201A: code = 0x82; break;
                    case 0x0192: code = 0x83; break;
                    case 0x201E: code = 0x84; break;
                    case 0x2026: code = 0x85; break;
                    case 0x2020: code = 0x86; break;
                    case 0x2021: code = 0x87; break;
                    case 0x02C6: code = 0x88; break;
                    case 0x2030: code = 0x89; break;
                    case 0x0160: code = 0x8A; break;
                    case 0x2039: code = 0x8B; break;
                    case 0x0152: code = 0x8C; break;
                    case 0x017D: code = 0x8E; break;
                    case 0x2018: code = 0x91; break;
                    case 0x2019: code = 0x92; break;
                    case 0x201C: code = 0x93; break;
                    case 0x201D: code = 0x94; break;
                    case 0x2022: code = 0x95; break;
                    case 0x2013: code = 0x96; break;
                    case 0x2014: code = 0x97; break;
                    case 0x02DC: code = 0x98; break;
                    case 0x2122: code = 0x99; break;
                    case 0x0161: code = 0x9A; break;
                    case 0x203A: code = 0x9B; break;
                    case 0x0153: code = 0x9C; break;
                    case 0x017E: code = 0x9E; break;
                    case 0x0178: code = 0x9F; break;
                    default: 
                }
            }
            buf[i] = code & 0xFF;
        }
        const decoded = buf.toString('utf8');
        if (decoded.includes('\uFFFD')) return str;
        return decoded;
    } catch(e) {
        return str;
    }
}

function processDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.match(/\.(tsx|ts|jsx|js|html)$/)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('Ã') || content.includes('Ã§') || content.includes('Ã£') || content.includes('Ã³')) {
                const fixed = fixString(content);
                if (fixed !== content) {
                    console.log('Fixed', fullPath);
                    fs.writeFileSync(fullPath, fixed, 'utf8');
                }
            }
        }
    }
}

processDir('src');
processDir('backend/public');
console.log('Done');
