const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const exts = ['.js', '.jsx', '.ts', '.tsx', '.json'];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      files = files.concat(walk(full));
    } else if (/\.(js|jsx|ts|tsx)$/.test(e.name)) {
      files.push(full);
    }
  }
  return files;
}

function findImportStrings(code) {
  const regex = /(?:import\s+(?:[^'"]+?)\s+from\s+|require\()(["'])(\.\.\/|\.\/)[^"']+\1/g;
  const matches = [];
  let m;
  while ((m = regex.exec(code))) {
    // regex captures quote in group 1 and relative prefix in group 2, but we need the full string
    const quote = m[1];
    // extract the actual path between quotes by searching backwards/forwards
    const start = m.index + m[0].indexOf(quote);
    const end = code.indexOf(quote, start + 1);
    const imp = code.slice(start + 1, end);
    matches.push(imp);
    regex.lastIndex = end + 1;
  }
  return matches;
}

function resolveImport(fromFile, imp) {
  // only relative imports
  const base = path.dirname(fromFile);
  const candidates = [];
  if (path.extname(imp)) {
    candidates.push(path.resolve(base, imp));
  } else {
    for (const e of exts) {
      candidates.push(path.resolve(base, imp + e));
    }
    candidates.push(path.resolve(base, imp, 'index.js'));
    candidates.push(path.resolve(base, imp, 'index.jsx'));
  }
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function checkCaseSensitivity(resolvedPath) {
  const parts = path.relative(ROOT, resolvedPath).split(path.sep);
  let cur = ROOT;
  for (const part of parts) {
    const entries = fs.readdirSync(cur);
    const foundExact = entries.find(e => e === part);
    if (!foundExact) {
      const foundIgnore = entries.find(e => e.toLowerCase() === part.toLowerCase());
      if (foundIgnore) {
        // mismatch
        return { ok: false, expected: part, actual: foundIgnore, parent: cur };
      } else {
        // doesn't exist at all
        return { ok: false, expected: part, actual: null, parent: cur };
      }
    }
    cur = path.join(cur, part);
  }
  return { ok: true };
}

function main() {
  const files = walk(path.join(ROOT, 'src'));
  const problems = [];
  for (const f of files) {
    const code = fs.readFileSync(f, 'utf8');
    const imports = findImportStrings(code);
    for (const imp of imports) {
      const resolved = resolveImport(f, imp);
      if (!resolved) continue;
      const check = checkCaseSensitivity(resolved);
      if (!check.ok) {
        problems.push({ file: f, import: imp, resolved, check });
      }
    }
  }

  if (problems.length === 0) {
    console.log('No relative-import case mismatches detected under src/');
    process.exit(0);
  }

  console.log('Detected possible case mismatches (these can fail on Linux):\n');
  for (const p of problems) {
    console.log('- File: ' + path.relative(ROOT, p.file));
    console.log('  Import: ' + p.import);
    console.log('  Resolved: ' + path.relative(ROOT, p.resolved));
    if (p.check.actual === null) {
      console.log('  Issue: target does not exist under ' + p.check.parent);
    } else {
      console.log('  Issue: case mismatch — import expects "' + p.check.expected + '", actual entry is "' + p.check.actual + '" in ' + p.check.parent);
    }
    console.log('');
  }
  process.exit(2);
}

main();
