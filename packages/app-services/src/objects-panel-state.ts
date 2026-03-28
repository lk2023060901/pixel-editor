import type { ObjectsPanelViewState } from "./ui-models";

export type ObjectsPanelObjectItem = ObjectsPanelViewState["objects"][number];

export function normalizeObjectsPanelFilterKeyword(filterText: string): string {
  return filterText.trim().toLowerCase();
}

export function deriveFilteredObjectsPanelItems(args: {
  objects: readonly ObjectsPanelObjectItem[];
  filterText: string;
  getShapeLabel: (shape: ObjectsPanelObjectItem["shape"]) => string;
}): readonly ObjectsPanelObjectItem[] {
  const keyword = normalizeObjectsPanelFilterKeyword(args.filterText);

  if (keyword.length === 0) {
    return args.objects;
  }

  return args.objects.filter((object) => {
    return (
      object.name.toLowerCase().includes(keyword) ||
      args.getShapeLabel(object.shape).toLowerCase().includes(keyword)
    );
  });
}
