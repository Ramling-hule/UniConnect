const fs = require('fs');
const path = require('path');

const refactorFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    if (!content.includes('asyncHandler')) {
        content = `import { asyncHandler } from '../utils/asyncHandler.js';\nimport AppError from '../utils/AppError.js';\n` + content;
    }
    content = content.replace(/export const (\w+) = async \(req, res\) => \{/g, 'export const $1 = asyncHandler(async (req, res, next) => {');
};
