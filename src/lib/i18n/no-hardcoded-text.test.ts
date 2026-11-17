import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";

/**
 * Visible text in the covered files must come from the dictionaries
 * (`src/lib/i18n/dictionaries`). Each 4E batch adds its folders here; at the
 * end the list covers the whole private area.
 */
const covered = [
  "src/app/layout.tsx",
  "src/app/acceder",
  "src/app/login",
  "src/app/espacios",
  "src/app/onboarding",
  "src/app/admin/buscar",
  "src/app/propietario/layout.tsx",
  "src/app/propietario/page.tsx",
  "src/app/propietario/perfil",
  "src/app/inquilino/layout.tsx",
  "src/app/inquilino/page.tsx",
  "src/app/inquilino/perfil",
  "src/app/solicitante",
  "src/app/huesped",
  "src/components/access",
  "src/components/auth",
  "src/components/i18n",
  "src/components/layout",
  "src/components/organizations",
  "src/components/properties/property-access-denied.tsx",
];

/** Brand names and symbols that are the same in every language. */
const allowed = new Set([
  "MGHPM",
  "MGHPM Property Management",
  "MY GLOBAL HUB",
  "My Global Hub",
  "Property Management",
]);

const root = join(import.meta.dirname, "..", "..", "..");

function files(path: string): string[] {
  const absolute = join(root, path);
  if (statSync(absolute).isFile()) return [absolute];
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(join(path, entry.name))
      : /\.tsx?$/.test(entry.name) && !entry.name.endsWith(".test.ts")
        ? [join(absolute, entry.name)]
        : [],
  );
}

/** Drops comments (line, block and JSX) so they never count as visible text. */
function withoutComments(source: string) {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
}

const hasLetters = (text: string) => /\p{L}/u.test(text);

function findings(source: string) {
  const code = withoutComments(source);
  const found: string[] = [];
  // Text between JSX tags: >Texto<
  for (const match of code.matchAll(/>([^<>{}`\n]+)</g)) {
    const text = match[1]!.trim();
    if (hasLetters(text) && !allowed.has(text)) found.push(`text: ${text}`);
  }
  // Literal text attributes.
  for (const match of code.matchAll(/\b(placeholder|aria-label|title|alt)="([^"]*)"/g)) {
    if (hasLetters(match[2]!) && !allowed.has(match[2]!)) found.push(`${match[1]}: ${match[2]}`);
  }
  // String literals with Spanish letters or punctuation.
  for (const match of code.matchAll(/(["'`])((?:(?!\1)[^\n\\])*[áéíóúñÁÉÍÓÚÑ¿¡](?:(?!\1)[^\n\\])*)\1/g)) {
    if (!allowed.has(match[2]!)) found.push(`string: ${match[2]}`);
  }
  return found;
}

test("covered files take their visible text from the dictionaries", () => {
  const problems = covered.flatMap((path) =>
    files(path).flatMap((file) =>
      findings(readFileSync(file, "utf8")).map((finding) => `${relative(root, file)} → ${finding}`),
    ),
  );
  assert.deepEqual(problems, []);
});

test("the checker catches hardcoded text", () => {
  assert.deepEqual(findings(`<h1>Hola</h1>`), ["text: Hola"]);
  assert.deepEqual(findings(`<input placeholder="Buscar" />`), ["placeholder: Buscar"]);
  assert.deepEqual(findings(`setError("No se pudo guardar el título.")`), ["string: No se pudo guardar el título."]);
  assert.deepEqual(findings(`<h1>{t.title}</h1>`), []);
  assert.deepEqual(findings(`{/* Sección de prueba */}`), []);
  assert.deepEqual(findings(`<span>MGHPM</span>`), []);
});
