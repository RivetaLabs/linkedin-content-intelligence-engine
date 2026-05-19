import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "coverage"]);
const TEXT_EXTENSIONS = new Set([
  ".css",
  ".example",
  ".json",
  ".md",
  ".mjs",
  ".sql",
  ".toml",
  ".ts",
  ".tsx",
]);

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function textFiles(): string[] {
  return walk(ROOT).filter((file) => {
    if (path.basename(file) === "package-lock.json") return false;
    if (path.basename(file) === ".env.example") return true;
    return TEXT_EXTENSIONS.has(path.extname(file));
  });
}

function phrase(parts: string[]): string {
  return parts.join("");
}

describe("public staging sanitization", () => {
  it("does not include excluded private paths", () => {
    const forbiddenSegments = [
      ".codex",
      ".claude",
      ".agents",
      ".superpowers",
      ".playwright-mcp",
      ".vercel",
      ".worktrees",
      "analysis",
      "generated",
      "harness",
      phrase(["ref", "rence"]),
    ];

    const offenders = walk(ROOT).filter((file) => {
      const relative = path.relative(ROOT, file);
      if (relative === "data" || relative.startsWith(`data${path.sep}`)) {
        return true;
      }
      return relative
        .split(path.sep)
        .some((segment) => forbiddenSegments.includes(segment));
    });

    expect(offenders).toEqual([]);
  });

  it("only includes the public root runtime policy file", () => {
    const instructionFiles = walk(ROOT)
      .map((file) => path.relative(ROOT, file))
      .filter((file) => {
        const name = path.basename(file);
        return name === "CLAUDE.md" || name === "AGENTS.md";
      })
      .sort();

    expect(instructionFiles).toEqual(["CLAUDE.md"]);
  });

  it("does not include legacy private-source prompt filenames", () => {
    const legacyFiles = walk(ROOT).filter((file) =>
      path.basename(file).toLowerCase().includes(phrase(["horm", "ozi"])),
    );

    expect(legacyFiles).toEqual([]);
    expect(
      fs.existsSync(path.join(ROOT, "lib/prompts/core/copywriting-techniques.ts")),
    ).toBe(true);
  });

  it("does not contain private identifiers or domain-specific client defaults", () => {
    const forbidden = [
      phrase(["mor", "gan"]),
      phrase(["su", "zanne"]),
      phrase(["hqbgd", "trdjap", "cytyppznv"]),
      phrase(["special", "-", "engine"]),
      phrase(["riveta", "labs"]),
      phrase(["horm", "ozi"]),
      phrase(["phar", "ma"]),
      phrase(["bio", "tech"]),
      phrase(["market ", "access"]),
      phrase(["rare ", "disease"]),
      phrase(["for", "mulary"]),
      phrase(["h", "eor"]),
      phrase(["api", "fy"]),
      phrase(["goog", "le"]),
    ];

    const offenders: string[] = [];
    for (const file of textFiles()) {
      const content = fs.readFileSync(file, "utf8").toLowerCase();
      for (const token of forbidden) {
        if (content.includes(token)) {
          offenders.push(`${path.relative(ROOT, file)} -> ${token}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("ships placeholder environment values only", () => {
    const envPath = path.join(ROOT, ".env.example");
    const env = fs.readFileSync(envPath, "utf8");

    expect(env).toContain("replace-with-your-anon-key");
    expect(env).toContain("replace-with-local-demo-password");
    expect(env).not.toMatch(/sk-[a-z0-9_-]{12,}/i);
    expect(env).not.toMatch(/tvly-[a-z0-9_-]{12,}/i);
    expect(env).not.toMatch(/[a-f0-9]{64}/i);
  });
});
