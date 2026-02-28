const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const destDir = path.join(process.env.USERPROFILE, '.gemini', 'antigravity', 'scratch', 'crm-temporal-push');

const ignoredDirs = ['node_modules', '.git', '.next'];

function copySync(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (let entry of entries) {
        if (ignoredDirs.includes(entry.name)) continue;
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copySync(srcPath, destPath);
        } else {
            try {
                fs.copyFileSync(srcPath, destPath);
            } catch (e) {
                console.warn(`Skipping ${srcPath}: ${e.message}`);
            }
        }
    }
}

console.log('Starting copy to', destDir);
copySync(srcDir, destDir);
console.log('Copy complete');
