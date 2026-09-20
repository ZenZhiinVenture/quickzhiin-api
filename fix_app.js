const fs = require('fs');
const path = 'src/app.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("import lhdnRoutes from './routes/lhdn';\n", "");
content = content.replace("app.use(`${apiPrefix}/lhdn`, requireTenant, lhdnRoutes);\n", "");

fs.writeFileSync(path, content);
