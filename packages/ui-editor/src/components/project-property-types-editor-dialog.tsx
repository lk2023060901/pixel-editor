"use client";

import type { ProjectPropertyTypesEditorStore } from "@pixel-editor/app-services/ui-store";
import {
  appendProjectClassPropertyFieldDraft,
  appendProjectEnumPropertyTypeValueDraft,
  classPropertyTypeUseAsOptions,
  createProjectPropertyTypesEditorState,
  createProjectClassPropertyTypeDraft,
  createProjectEnumPropertyTypeDraft,
  deriveProjectPropertyTypesEditorSelection,
  deriveProjectPropertyTypeReferenceOptions,
  deriveProjectPropertyTypeValueEditorControl,
  propertyTypeValueOptions,
  removeProjectClassPropertyFieldDraft,
  removeProjectEnumPropertyTypeValueDraft,
  removeProjectPropertyTypeDraft,
  resolveProjectPropertyTypesApplyResult,
  resolveProjectPropertyTypeValueEditorValue,
  selectProjectPropertyTypesEditorType,
  toggleProjectClassPropertyTypeUseAsDraft,
  updateProjectClassPropertyFieldDefaultValueDraft,
  updateProjectClassPropertyFieldNameDraft,
  updateProjectClassPropertyFieldReferenceTypeDraft,
  updateProjectClassPropertyFieldValueTypeDraft,
  updateProjectClassPropertyTypeColorDraft,
  updateProjectClassPropertyTypeDrawFillDraft,
  updateProjectEnumPropertyTypeValueDraft,
  updateProjectEnumStorageTypeDraft,
  updateProjectEnumValuesAsFlagsDraft,
  updateProjectPropertyTypeNameDraft,
  updateProjectPropertyTypesEditorDraftsState,
  type PropertyTypeDefinition,
  type PropertyTypeName,
  type PropertyValue
} from "@pixel-editor/app-services/ui-property-types";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import {
  getPropertyTypeLabel,
  getPropertyTypeUseAsLabel
} from "./i18n-helpers";

function DialogTextInput(props: {
  value: string;
  type?: "text" | "number" | "color";
  onChange: (value: string) => void;
}) {
  return (
    <input
      className="h-8 w-full border border-slate-600 bg-slate-950 px-2 text-sm text-slate-100 outline-none"
      inputMode={props.type === "number" ? "numeric" : undefined}
      type={props.type ?? "text"}
      value={props.value}
      onChange={(event) => {
        props.onChange(event.target.value);
      }}
    />
  );
}

function DialogSelect(props: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <select
      className="h-8 w-full border border-slate-600 bg-slate-950 px-2 text-sm text-slate-100 outline-none"
      value={props.value}
      onChange={(event) => {
        props.onChange(event.target.value);
      }}
    >
      {props.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function DialogCheckbox(props: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-200">
      <input
        checked={props.checked}
        type="checkbox"
        onChange={(event) => {
          props.onChange(event.target.checked);
        }}
      />
      <span>{props.label}</span>
    </label>
  );
}

function PropertyValueEditor(props: {
  valueType: PropertyTypeName;
  propertyTypeName?: string;
  propertyTypes: readonly PropertyTypeDefinition[];
  value: PropertyValue | undefined;
  lineage?: readonly string[];
  onChange: (value: PropertyValue) => void;
}) {
  const { t } = useI18n();
  const control = deriveProjectPropertyTypeValueEditorControl({
    valueType: props.valueType,
    propertyTypeName: props.propertyTypeName,
    propertyTypes: props.propertyTypes,
    value: props.value,
    ...(props.lineage !== undefined ? { lineage: props.lineage } : {})
  });

  switch (control.kind) {
    case "boolean":
      return (
        <DialogCheckbox
          checked={control.checked}
          label={control.checked ? t("common.true") : t("common.false")}
          onChange={(checked) => {
            props.onChange(
              resolveProjectPropertyTypeValueEditorValue({
                control,
                nextValue: checked
              })
            );
          }}
        />
      );
    case "number":
      return (
        <DialogTextInput
          type="number"
          value={control.value}
          onChange={(value) => {
            props.onChange(
              resolveProjectPropertyTypeValueEditorValue({
                control,
                nextValue: value
              })
            );
          }}
        />
      );
    case "text":
      return (
        <DialogTextInput
          value={control.value}
          onChange={(value) => {
            props.onChange(
              resolveProjectPropertyTypeValueEditorValue({
                control,
                nextValue: value
              })
            );
          }}
        />
      );
    case "object":
      return (
        <DialogTextInput
          value={control.value}
          onChange={(value) => {
            props.onChange(
              resolveProjectPropertyTypeValueEditorValue({
                control,
                nextValue: value
              })
            );
          }}
        />
      );
    case "select":
      return (
        <DialogSelect
          value={control.value}
          options={control.options}
          onChange={(value) => {
            props.onChange(
              resolveProjectPropertyTypeValueEditorValue({
                control,
                nextValue: value
              })
            );
          }}
        />
      );
    case "class":
      return (
        <div className="space-y-2">
          {control.classType.fields.map((field) => (
            <div
              key={`${field.name}:${field.valueType}`}
              className="rounded border border-slate-700 bg-slate-950/60 p-2"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-200">{field.name}</span>
                <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  {getPropertyTypeLabel(field.valueType, t)}
                </span>
              </div>
              <PropertyValueEditor
                lineage={control.nextLineage}
                propertyTypes={props.propertyTypes}
                value={control.members[field.name] ?? field.defaultValue}
                valueType={field.valueType}
                {...(field.propertyTypeName !== undefined
                  ? { propertyTypeName: field.propertyTypeName }
                  : {})}
                onChange={(value) => {
                  props.onChange({
                    members: {
                      ...control.members,
                      [field.name]: value
                    }
                  });
                }}
              />
            </div>
          ))}
        </div>
      );
    case "recursive":
      return (
        <div className="text-sm text-slate-400">
          {t("propertyTypesEditor.recursiveDefaultValue")}
        </div>
      );
    case "unsupported":
      return (
        <div className="text-sm text-slate-400">
          {t("propertyTypesEditor.unsupportedDefaultValue")}
        </div>
      );
  }
}

export function ProjectPropertyTypesEditorDialog(props: {
  propertyTypes: readonly PropertyTypeDefinition[];
  store: ProjectPropertyTypesEditorStore;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [editorState, setEditorState] = useState(() =>
    createProjectPropertyTypesEditorState(props.propertyTypes)
  );
  const draftPropertyTypes = editorState.draftPropertyTypes;
  const selection = useMemo(
    () => deriveProjectPropertyTypesEditorSelection(draftPropertyTypes, editorState.selectedTypeId),
    [draftPropertyTypes, editorState.selectedTypeId]
  );
  const currentSelectedTypeId = selection.selectedTypeId;
  const selectedType = selection.selectedType;
  const selectedEnumType = selection.selectedEnumType;
  const selectedClassType = selection.selectedClassType;

  const { enumOptions, classOptions } = useMemo(
    () => deriveProjectPropertyTypeReferenceOptions(draftPropertyTypes),
    [draftPropertyTypes]
  );

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    setEditorState(createProjectPropertyTypesEditorState(props.propertyTypes));
  }, [props.propertyTypes]);

  function updateDrafts(
    updater: (draftPropertyTypes: readonly PropertyTypeDefinition[]) => PropertyTypeDefinition[],
    selectedTypeId?: string | null
  ): void {
    setEditorState((current) =>
      updateProjectPropertyTypesEditorDraftsState({
        state: current,
        draftPropertyTypes: updater(current.draftPropertyTypes),
        ...(selectedTypeId !== undefined ? { selectedTypeId } : {})
      })
    );
  }

  function addEnumType(): void {
    setEditorState((current) => {
      const nextType = createProjectEnumPropertyTypeDraft({
        existingPropertyTypes: current.draftPropertyTypes,
        defaultEnumName: t("propertyTypesEditor.defaultEnumName"),
        defaultValueName: t("propertyTypesEditor.defaultValueName")
      });

      return updateProjectPropertyTypesEditorDraftsState({
        state: current,
        draftPropertyTypes: [...current.draftPropertyTypes, nextType],
        selectedTypeId: nextType.id
      });
    });
  }

  function addClassType(): void {
    setEditorState((current) => {
      const nextType = createProjectClassPropertyTypeDraft({
        existingPropertyTypes: current.draftPropertyTypes,
        defaultClassName: t("propertyTypesEditor.defaultClassName")
      });

      return updateProjectPropertyTypesEditorDraftsState({
        state: current,
        draftPropertyTypes: [...current.draftPropertyTypes, nextType],
        selectedTypeId: nextType.id
      });
    });
  }

  function removeSelectedType(): void {
    if (!currentSelectedTypeId) {
      return;
    }

    updateDrafts((current) => removeProjectPropertyTypeDraft(current, currentSelectedTypeId));
  }

  function applyDrafts(): void {
    const resolution = resolveProjectPropertyTypesApplyResult({
      state: editorState,
      t
    });
    setEditorState(resolution.nextState);

    if (!resolution.propertyTypes) {
      return;
    }

    const nextPropertyTypes = resolution.propertyTypes;
    startTransition(() => {
      props.store.replaceProjectPropertyTypes(nextPropertyTypes);
    });
    props.onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-6 py-8">
      <div
        ref={dialogRef}
        aria-label={t("propertyTypesEditor.title")}
        aria-modal="true"
        className="flex h-[680px] w-[1080px] flex-col border border-slate-700 bg-slate-900 shadow-[0_18px_60px_rgba(2,6,23,0.7)] outline-none"
        role="dialog"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            props.onClose();
          }
        }}
      >
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
          <div>
            <div className="text-sm font-medium text-slate-100">
              {t("propertyTypesEditor.title")}
            </div>
            <div className="text-xs text-slate-400">{t("propertyTypesEditor.customTypes")}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700"
              type="button"
              onClick={addEnumType}
            >
              {t("propertyTypesEditor.addEnum")}
            </button>
            <button
              className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700"
              type="button"
              onClick={addClassType}
            >
              {t("propertyTypesEditor.addClass")}
            </button>
            <button
              className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!selectedType}
              type="button"
              onClick={removeSelectedType}
            >
              {t("propertyTypesEditor.removeType")}
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[260px_minmax(0,1fr)]">
          <div className="min-h-0 border-r border-slate-700 bg-slate-950">
            <div className="h-full overflow-y-auto">
              {draftPropertyTypes.length > 0 ? (
                <div className="divide-y divide-slate-800">
                  {draftPropertyTypes.map((propertyType) => (
                    <button
                      key={propertyType.id}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition ${
                        propertyType.id === currentSelectedTypeId
                          ? "bg-blue-600/40 text-slate-50"
                          : "text-slate-200 hover:bg-slate-800"
                      }`}
                      type="button"
                      onClick={() => {
                        setEditorState((current) =>
                          selectProjectPropertyTypesEditorType(current, propertyType.id)
                        );
                      }}
                    >
                      <span className="min-w-0 truncate">{propertyType.name}</span>
                      <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
                        {propertyType.kind}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-3 text-sm text-slate-400">
                  {t("propertyTypesEditor.noSelection")}
                </div>
              )}
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto bg-slate-900">
            {selectedType ? (
              <div className="space-y-4 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">
                      {t("propertyTypesEditor.typeName")}
                    </span>
                    <DialogTextInput
                      value={selectedType.name}
                      onChange={(value) => {
                        updateDrafts((current) =>
                          updateProjectPropertyTypeNameDraft(current, selectedType.id, value)
                        );
                      }}
                    />
                  </label>
                  <div className="space-y-2">
                    <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">
                      {t("common.type")}
                    </span>
                    <div className="flex h-8 items-center border border-slate-700 bg-slate-950 px-2 text-sm text-slate-300">
                      {getPropertyTypeLabel(selectedType.kind, t)}
                    </div>
                  </div>
                </div>

                {selectedEnumType ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">
                          {t("propertyTypesEditor.storageType")}
                        </span>
                        <DialogSelect
                          options={[
                            { value: "string", label: getPropertyTypeLabel("string", t) },
                            { value: "int", label: getPropertyTypeLabel("int", t) }
                          ]}
                          value={selectedEnumType.storageType}
                          onChange={(value) => {
                            updateDrafts((current) =>
                              updateProjectEnumStorageTypeDraft(
                                current,
                                selectedEnumType.id,
                                value as "string" | "int"
                              )
                            );
                          }}
                        />
                      </label>
                      <div className="space-y-2">
                        <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">
                          {t("propertyTypesEditor.valuesAsFlags")}
                        </span>
                        <div className="flex h-8 items-center border border-slate-700 bg-slate-950 px-2">
                          <DialogCheckbox
                            checked={selectedEnumType.valuesAsFlags}
                            label={t("propertyTypesEditor.valuesAsFlags")}
                            onChange={(checked) => {
                              updateDrafts((current) =>
                                updateProjectEnumValuesAsFlagsDraft(
                                  current,
                                  selectedEnumType.id,
                                  checked
                                )
                              );
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-medium text-slate-100">
                          {t("propertyTypesEditor.enumValues")}
                        </h3>
                        <button
                          className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700"
                          type="button"
                          onClick={() => {
                            updateDrafts((current) =>
                              appendProjectEnumPropertyTypeValueDraft(
                                current,
                                selectedEnumType.id,
                                t("propertyTypesEditor.defaultValueName")
                              )
                            );
                          }}
                        >
                          {t("propertyTypesEditor.addValue")}
                        </button>
                      </div>
                      {selectedEnumType.values.length > 0 ? (
                        <div className="space-y-2">
                          {selectedEnumType.values.map((value, valueIndex) => (
                            <div
                              key={`${selectedEnumType.id}:value:${valueIndex}`}
                              className="flex items-center gap-2"
                            >
                              <DialogTextInput
                                value={value}
                                onChange={(nextValue) => {
                                  updateDrafts((current) =>
                                    updateProjectEnumPropertyTypeValueDraft(
                                      current,
                                      selectedEnumType.id,
                                      valueIndex,
                                      nextValue
                                    )
                                  );
                                }}
                              />
                              <button
                                className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700"
                                type="button"
                                onClick={() => {
                                  updateDrafts((current) =>
                                    removeProjectEnumPropertyTypeValueDraft(
                                      current,
                                      selectedEnumType.id,
                                      valueIndex
                                    )
                                  );
                                }}
                              >
                                {t("common.remove")}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded border border-dashed border-slate-700 bg-slate-950/50 px-3 py-4 text-sm text-slate-400">
                          {t("propertyTypesEditor.noEnumValues")}
                        </div>
                      )}
                    </div>
                  </div>
                ) : selectedClassType ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">
                          {t("propertyTypesEditor.color")}
                        </span>
                        <DialogTextInput
                          value={selectedClassType.color ?? ""}
                          onChange={(value) => {
                            updateDrafts((current) =>
                              updateProjectClassPropertyTypeColorDraft(
                                current,
                                selectedClassType.id,
                                value
                              )
                            );
                          }}
                        />
                      </label>
                      <div className="space-y-2">
                        <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">
                          {t("propertyTypesEditor.drawFill")}
                        </span>
                        <div className="flex h-8 items-center border border-slate-700 bg-slate-950 px-2">
                          <DialogCheckbox
                            checked={selectedClassType.drawFill ?? false}
                            label={t("propertyTypesEditor.drawFill")}
                            onChange={(checked) => {
                              updateDrafts((current) =>
                                updateProjectClassPropertyTypeDrawFillDraft(
                                  current,
                                  selectedClassType.id,
                                  checked
                                )
                              );
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-slate-100">
                        {t("propertyTypesEditor.usage")}
                      </h3>
                      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {classPropertyTypeUseAsOptions.map((useAs) => (
                          <div
                            key={useAs}
                            className="rounded border border-slate-700 bg-slate-950/60 px-3 py-2"
                          >
                            <DialogCheckbox
                              checked={selectedClassType.useAs.includes(useAs)}
                              label={getPropertyTypeUseAsLabel(useAs, t)}
                              onChange={(checked) => {
                                updateDrafts((current) =>
                                  toggleProjectClassPropertyTypeUseAsDraft(
                                    current,
                                    selectedClassType.id,
                                    useAs,
                                    checked
                                  )
                                );
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-medium text-slate-100">
                          {t("propertyTypesEditor.classFields")}
                        </h3>
                        <button
                          className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700"
                          type="button"
                          onClick={() => {
                            updateDrafts((current) =>
                              appendProjectClassPropertyFieldDraft({
                                drafts: current,
                                propertyTypeId: selectedClassType.id,
                                defaultFieldName: t("propertyTypesEditor.defaultFieldName"),
                                defaultValueType: "string"
                              })
                            );
                          }}
                        >
                          {t("propertyTypesEditor.addField")}
                        </button>
                      </div>
                      {selectedClassType.fields.length > 0 ? (
                        <div className="space-y-3">
                          {selectedClassType.fields.map((field, fieldIndex) => (
                            <div
                              key={`${selectedClassType.id}:field:${fieldIndex}:${field.name}`}
                              className="space-y-3 border border-slate-700 bg-slate-950/60 p-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-medium text-slate-100">
                                  {field.name || t("propertyTypesEditor.fieldName")}
                                </span>
                                <button
                                  className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700"
                                  type="button"
                                  onClick={() => {
                                    updateDrafts((current) =>
                                      removeProjectClassPropertyFieldDraft(
                                        current,
                                        selectedClassType.id,
                                        fieldIndex
                                      )
                                    );
                                  }}
                                >
                                  {t("propertyTypesEditor.removeField")}
                                </button>
                              </div>

                              <div className="grid gap-3 md:grid-cols-2">
                                <label className="space-y-2">
                                  <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">
                                    {t("propertyTypesEditor.fieldName")}
                                  </span>
                                  <DialogTextInput
                                    value={field.name}
                                    onChange={(value) => {
                                      updateDrafts((current) =>
                                        updateProjectClassPropertyFieldNameDraft(
                                          current,
                                          selectedClassType.id,
                                          fieldIndex,
                                          value
                                        )
                                      );
                                    }}
                                  />
                                </label>

                                <label className="space-y-2">
                                  <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">
                                    {t("common.type")}
                                  </span>
                                  <DialogSelect
                                    options={propertyTypeValueOptions.map((valueType) => ({
                                      value: valueType,
                                      label: getPropertyTypeLabel(valueType, t)
                                    }))}
                                    value={field.valueType}
                                    onChange={(value) => {
                                      updateDrafts((current) =>
                                        updateProjectClassPropertyFieldValueTypeDraft({
                                          drafts: current,
                                          propertyTypeId: selectedClassType.id,
                                          fieldIndex,
                                          nextValueType: value as PropertyTypeName
                                        })
                                      );
                                    }}
                                  />
                                </label>
                              </div>

                              {field.valueType === "enum" || field.valueType === "class" ? (
                                <label className="space-y-2">
                                  <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">
                                    {t("propertyTypesEditor.referencedType")}
                                  </span>
                                  <DialogSelect
                                    options={
                                      field.valueType === "enum" ? enumOptions : classOptions
                                    }
                                    value={field.propertyTypeName ?? ""}
                                    onChange={(value) => {
                                      updateDrafts((current) =>
                                        updateProjectClassPropertyFieldReferenceTypeDraft({
                                          drafts: current,
                                          propertyTypeId: selectedClassType.id,
                                          fieldIndex,
                                          propertyTypeName: value || undefined
                                        })
                                      );
                                    }}
                                  />
                                </label>
                              ) : null}

                              <div className="space-y-2">
                                <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">
                                  {t("propertyTypesEditor.defaultValue")}
                                </span>
                                <PropertyValueEditor
                                  propertyTypes={draftPropertyTypes}
                                  value={field.defaultValue}
                                  valueType={field.valueType}
                                  {...(field.propertyTypeName !== undefined
                                    ? { propertyTypeName: field.propertyTypeName }
                                    : {})}
                                  onChange={(value) => {
                                    updateDrafts((current) =>
                                      updateProjectClassPropertyFieldDefaultValueDraft({
                                        drafts: current,
                                        propertyTypeId: selectedClassType.id,
                                        fieldIndex,
                                        defaultValue: value
                                      })
                                    );
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded border border-dashed border-slate-700 bg-slate-950/50 px-3 py-4 text-sm text-slate-400">
                          {t("propertyTypesEditor.noFields")}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="px-4 py-4 text-sm text-slate-400">
                {t("propertyTypesEditor.noSelection")}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-700 px-4 py-3">
          <div className="min-h-[20px] text-sm text-rose-300">
            {editorState.validationError ?? ""}
          </div>
          <div className="flex items-center gap-3">
            <button
              className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700"
              type="button"
              onClick={props.onClose}
            >
              {t("action.close")}
            </button>
            <button
              className="h-8 border border-emerald-500/60 bg-emerald-500/10 px-3 text-sm text-emerald-100 transition hover:bg-emerald-500/20"
              type="button"
              onClick={applyDrafts}
            >
              {t("common.apply")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
