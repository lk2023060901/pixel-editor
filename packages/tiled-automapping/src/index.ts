import {
  createAssetReference,
  normalizeAssetPath
} from "@pixel-editor/asset-reference";

import type {
  AutomappingRuleMapReference,
  AutomappingRulesImportIssue,
  AutomappingRulesImportOptions,
  AutomappingRulesIncludeReference,
  ImportedAutomappingRulesFile
} from "./types";

export * from "./types";

function appendIssue(
  issues: AutomappingRulesImportIssue[],
  path: string,
  code: string,
  message: string
): void {
  issues.push({
    severity: "warning",
    code,
    message,
    path
  });
}

function appendExternalAssetReferenceIssues(
  assetReferences: readonly ReturnType<typeof createAssetReference>[],
  issues: AutomappingRulesImportIssue[]
): void {
  assetReferences
    .filter((reference) => reference.externalToProject)
    .forEach((reference) => {
      appendIssue(
        issues,
        reference.ownerPath,
        "automapping.rules.asset.externalReference",
        `External automapping ${reference.kind} reference \`${reference.originalPath}\` is outside known project asset roots.`
      );
    });
}

function escapeRegExp(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function wildcardToRegExp(pattern: string): RegExp {
  let expression = "^";

  for (const character of pattern) {
    if (character === "*") {
      expression += ".*";
      continue;
    }

    if (character === "?") {
      expression += ".";
      continue;
    }

    expression += escapeRegExp(character);
  }

  expression += "$";

  return new RegExp(expression, "i");
}

export function matchesAutomappingMapName(
  mapName: string,
  mapNameFilter: string | undefined
): boolean {
  if (mapNameFilter === undefined) {
    return true;
  }

  return wildcardToRegExp(mapNameFilter).test(mapName);
}

export function importAutomappingRulesFile(
  input: string,
  options: AutomappingRulesImportOptions = {}
): ImportedAutomappingRulesFile {
  const ruleMaps: AutomappingRuleMapReference[] = [];
  const includes: AutomappingRulesIncludeReference[] = [];
  const assetReferences: ReturnType<typeof createAssetReference>[] = [];
  const issues: AutomappingRulesImportIssue[] = [];

  function visitRulesFile(
    source: string,
    pathPrefix: string,
    documentPath: string | undefined,
    inheritedFilter: string | undefined,
    activeStack: string[]
  ): void {
    const normalizedDocumentPath =
      documentPath !== undefined ? normalizeAssetPath(documentPath) : undefined;
    let currentFilter = inheritedFilter;
    let entryIndex = 0;
    const lines = source.split(/\r?\n/u);

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex] ?? "";
      const trimmedLine = line.trim();

      if (
        trimmedLine.length === 0 ||
        trimmedLine.startsWith("#") ||
        trimmedLine.startsWith("//")
      ) {
        continue;
      }

      if (trimmedLine.startsWith("[") && trimmedLine.endsWith("]")) {
        currentFilter = trimmedLine.slice(1, -1);
        continue;
      }

      const entryPath = `${pathPrefix}.entries[${entryIndex}]`;
      entryIndex += 1;
      const isRulesFile = trimmedLine.toLowerCase().endsWith(".txt");
      const assetReference = createAssetReference(
        isRulesFile ? "automapping-rules" : "map",
        `${entryPath}.path`,
        trimmedLine,
        {
          ...(normalizedDocumentPath !== undefined
            ? { documentPath: normalizedDocumentPath }
            : {}),
          ...(options.assetRoots !== undefined ? { assetRoots: options.assetRoots } : {})
        }
      );

      assetReferences.push(assetReference);

      if (isRulesFile) {
        includes.push({
          filePath: assetReference.resolvedPath,
          line: lineIndex + 1,
          ...(currentFilter !== undefined ? { mapNameFilter: currentFilter } : {}),
          ...(normalizedDocumentPath !== undefined
            ? { sourceFilePath: normalizedDocumentPath }
            : {})
        });

        const nextDocumentPath = assetReference.resolvedPath;

        if (!options.loadTextFile) {
          appendIssue(
            issues,
            `${entryPath}.path`,
            "automapping.rules.include.unresolved",
            `Referenced rules file \`${trimmedLine}\` was not expanded because no text loader was provided.`
          );
          continue;
        }

        if (activeStack.includes(nextDocumentPath)) {
          appendIssue(
            issues,
            `${entryPath}.path`,
            "automapping.rules.include.cycle",
            `Automapping rules include cycle detected for \`${nextDocumentPath}\`.`
          );
          continue;
        }

        const includedText = options.loadTextFile(nextDocumentPath);

        if (includedText === undefined) {
          appendIssue(
            issues,
            `${entryPath}.path`,
            "automapping.rules.file.notFound",
            `Referenced automapping rules file \`${nextDocumentPath}\` was not found.`
          );
          continue;
        }

        visitRulesFile(
          includedText,
          entryPath,
          nextDocumentPath,
          currentFilter,
          [...activeStack, nextDocumentPath]
        );
        continue;
      }

      ruleMaps.push({
        filePath: assetReference.resolvedPath,
        line: lineIndex + 1,
        ...(currentFilter !== undefined ? { mapNameFilter: currentFilter } : {}),
        ...(normalizedDocumentPath !== undefined
          ? { sourceFilePath: normalizedDocumentPath }
          : {})
      });
    }
  }

  const normalizedDocumentPath =
    options.documentPath !== undefined ? normalizeAssetPath(options.documentPath) : undefined;

  visitRulesFile(
    input,
    "rules",
    normalizedDocumentPath,
    undefined,
    normalizedDocumentPath !== undefined ? [normalizedDocumentPath] : []
  );

  appendExternalAssetReferenceIssues(assetReferences, issues);

  if (ruleMaps.length === 0) {
    appendIssue(
      issues,
      "rules",
      "automapping.rules.empty",
      "Automapping rules contained no rule maps."
    );
  }

  return {
    ruleMaps,
    includes,
    assetReferences,
    issues
  };
}
