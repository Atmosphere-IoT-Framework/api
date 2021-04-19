import React, { useState } from "react";
import { orderBy } from "natural-orderby";
import { ToastContainer, toast } from "react-toastify";

import {
  IConfigInputField,
  IConfigOptionSource,
  ICustomLabels,
} from "../../common/models/config.model";
import { Button } from "../button/button.comp";
import { withAppContext } from "../withContext/withContext.comp";
import { IAppContext } from "../app.context";
import { dataHelpers } from "../../helpers/data.helpers";
import locale from "../../common/locale";

import "./formRow.scss";
import { stringify } from "query-string";

import fontawesome from "@fortawesome/fontawesome";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/fontawesome-free-solid";

fontawesome.library.add(faPlus);

interface ILoadedFields {
  fieldName: string;
  values: Array<string>;
}

interface IOption {
  display: string;
  value: string;
}

interface IProps {
  context: IAppContext;
  field: IConfigInputField;
  loadedFields: ILoadedFields[];
  onChange: (
    fieldName: string,
    value: any,
    submitAfterChange?: boolean
  ) => void;
  onRemove: (fieldName: string, value: any) => void;
  showReset?: boolean;
  direction?: "row" | "column";
}

export const FormRow = withAppContext(
  ({
    context,
    field,
    loadedFields,
    direction,
    showReset,
    onChange,
    onRemove,
  }: IProps) => {
    const [optionSources, setOptionSources] = useState<any>({});
    const [loadedOptionSources, setLoadedOptionSources] = useState<any>();
    const { httpService, activePage, config } = context;
    const pageHeaders: any = activePage?.requestHeaders || {};
    const customLabels: ICustomLabels | undefined = {
      ...config?.customLabels,
      ...activePage?.customLabels,
    };
    const addArrayItemLabel = customLabels?.buttons?.addArrayItem || "Add Item";
    const clearLabel = customLabels?.buttons?.clearInput || "Clear";

    function insertPreloadedData(
      fieldName: string,
      optionSource: IConfigOptionSource
    ) {
      var optionsData = Array<string>(0).fill("");

      loadedFields.map((e) => {
        if (e.fieldName === optionSource.name) optionsData = e.values;
      });

      var optionDisplay = new Array<IOption>(optionsData.length);
      optionsData.map((opt: string, i: number) => {
        optionDisplay[i] = { display: opt, value: opt };
      });

      return { fieldname: fieldName, options: optionDisplay };
    }
    async function loadOptionSourceFromRemote(
      fieldName: string,
      optionSource: IConfigOptionSource
    ) {
      try {
        const {
          url,
          dataPath,
          preLoad,
          actualMethod,
          requestHeaders,
        } = optionSource;

        if (!url && !preLoad) {
          /* throw new Error(
            `URL option source (for field "${fieldName}") is empty.`
          );*/
        }

        const result = await httpService.fetch({
          method: actualMethod || "get",
          origUrl: url,
          queryParams: [],
          headers: Object.assign({}, pageHeaders, requestHeaders || {}),
        });

        const extractedData = dataHelpers.extractDataByDataPath(
          result,
          dataPath
        );

        if (!extractedData || !extractedData.length) {
          /*throw new Error(
            `Option source data is empty (for field "${fieldName}")`
          );*/
        }

        // Map option source to fields
        const optionSourceData = extractedData.map(
          (option: any, idx: number) => {
            const { valuePath, displayPath } = optionSource;

            if (typeof option === "string") {
              return option;
            }

            return {
              display:
                displayPath && option[displayPath]
                  ? option[displayPath]
                  : `Option ${idx + 1}`,
              value:
                valuePath && option[valuePath] ? option[valuePath] : `${idx}`,
            };
          }
        );

        setOptionSources({
          ...optionSources,
          [fieldName]: optionSourceData,
        });
      } catch (e) {
        toast.error(e.message, {
          position: toast.POSITION.TOP_CENTER,
        });
      }
    }

    function addItemToFieldArray(e: any, originalField: IConfigInputField) {
      e.preventDefault();

      onChange(field.name, [...(originalField.value || []), ""]);
    }

    function removeItemToFieldArray(
      originalField: IConfigInputField,
      idx: number
    ) {
      const updatedArray = [...(originalField.value || [])];

      const test = updatedArray.splice(idx, 1);

      test.forEach((e) => {
        onRemove(field.name, e);
      });

      onChange(field.name, updatedArray);
    }

    function renderArrayItems(originalField: IConfigInputField) {
      const array: any[] = originalField.value || [];

      return (
        <div className="array-form">
          {array.map((item, itemIdx) => {
            const inputField = renderFieldInput(
              {
                value: item,
                name: `${originalField.name}.${itemIdx}`,
              } as IConfigInputField,
              (fieldName, value) => {
                const updatedArray = (originalField.value || []).map(
                  (localValue: any, idx: number) => {
                    if (idx === itemIdx) {
                      return value;
                    }
                    return localValue;
                  }
                );

                onChange(originalField.name, updatedArray);
              }
            );

            return (
              <div className="array-form-item" key={`array_form_${itemIdx}`}>
                {inputField}
                <i
                  title={clearLabel}
                  onClick={() => removeItemToFieldArray(originalField, itemIdx)}
                  aria-label="Remove"
                  className="clear-input fa fa-times"
                ></i>
              </div>
            );
          })}
          <Button
            className="add-array-item"
            onClick={(e) => addItemToFieldArray(e, originalField)}
            title={addArrayItemLabel}
            disabled={originalField.disabled || originalField.readonly}
          >
            <i className="fa fa-plus" aria-hidden="true"></i>
          </Button>
        </div>
      );
    }

    function renderFieldInput(
      field: IConfigInputField,
      changeCallback: (
        fieldName: string,
        value: any,
        submitAfterChange?: boolean
      ) => void
    ) {
      const inputProps = (defaultPlaceholder: string = "") => {
        return {
          value: field.value,
          placeholder: field.placeholder || defaultPlaceholder,
          disabled: field.readonly || field.disabled,
          required: field.required,
          onChange: (e: any) => changeCallback(field.name, e.target.value),
        };
      };

      switch (field.type) {
        case "boolean":
          return (
            <input
              type="checkbox"
              {...inputProps()}
              checked={field.value}
              onChange={(e) =>
                changeCallback(field.name, e.target.checked, true)
              }
            />
          );
        case "select": {
          const { optionSource } = field;

          if (optionSource && optionSource.preLoad) {
            const loadedOption = insertPreloadedData(field.name, optionSource);

            return (
              <select {...inputProps()}>
                <option>{locale().select}</option>
                {loadedOption.options.map((option, idx) => {
                  const key = `option_${idx}_`;
                  return (
                    <option key={`${key}_${option.value}`} value={option.value}>
                      {option.display || option.value}
                    </option>
                  );
                })}
              </select>
            );
          } else {
            if (optionSource && !optionSources[field.name]) {
              loadOptionSourceFromRemote(field.name, optionSource);
              return (
                <select {...inputProps()}>
                  <option>-- Loading Options... --</option>
                </select>
              );
            }

            const sortBy = field.optionSource?.sortBy;
            const finalOptions: { value: string; display: string }[] =
              optionSources[field.name] || field.options || [];
            const sortedOptions = orderBy(
              finalOptions,
              typeof sortBy === "string" ? [sortBy] : sortBy || []
            );

            return (
              <select {...inputProps()}>
                <option>{locale().select}</option>
                {sortedOptions.map((option, idx) => {
                  const key = `option_${idx}_`;
                  if (typeof option !== "object") {
                    return (
                      <option key={`${key}_${option}`} value={option}>
                        {option}
                      </option>
                    );
                  }
                  return (
                    <option key={`${key}_${option.value}`} value={option.value}>
                      {option.display || option.value}
                    </option>
                  );
                })}
              </select>
            );
          }
        }
        case "object":
          return (
            <textarea
              {...inputProps(
                customLabels?.placeholders?.object || "Enter JSON..."
              )}
            ></textarea>
          );
        case "array": {
          const { arrayType, value } = field;
          if (!value || !arrayType || arrayType === "object") {
            return (
              <textarea
                {...inputProps(
                  customLabels?.placeholders?.array || "Enter JSON array..."
                )}
              ></textarea>
            );
          }
          return renderArrayItems(field);
        }
        case "long-text":
          return (
            <textarea
              {...inputProps(
                customLabels?.placeholders?.text || locale().enter_text
              )}
            ></textarea>
          );
        case "number":
        case "integer":
          return (
            <input
              type="number"
              {...inputProps(customLabels?.placeholders?.number || "0")}
              onChange={(e) =>
                changeCallback(field.name, e.target.valueAsNumber)
              }
            />
          );
        case "color":
          return (
            <input
              type="color"
              {...inputProps(
                customLabels?.placeholders?.color || locale().enter_color
              )}
            />
          );
        case "email":
          return (
            <input
              type="email"
              {...inputProps(
                customLabels?.placeholders?.email || locale().enter_email
              )}
            />
          );
        case "password":
          return (
            <input
              type="password"
              {...inputProps(
                customLabels?.placeholders?.password || locale().enter_password
              )}
            />
          );
        case "hidden":
          return <input type="hidden" value={field.value} />;
        case "file":
          return (
            <input
              type="file"
              accept={field.accept || "*"}
              placeholder={
                field.placeholder ||
                customLabels?.placeholders?.file ||
                "Select file..."
              }
              name={field.name || "file"}
              disabled={field.readonly}
              required={field.required}
            />
          );
        case "note":
          return <p className="note">{field.value}</p>;
        case "date":
          return (
            <input
              type="date"
              {...inputProps(
                customLabels?.placeholders?.date || locale().enter_date
              )}
            />
          );
        case "text":
        default:
          return (
            <input
              type="text"
              {...inputProps(
                customLabels?.placeholders?.text || locale().enter_text
              )}
            />
          );
      }
    }

    return (
      <div className={`form-row ${direction || "row"}`}>
        {field.type !== "hidden" && (
          <label>
            {field.label || field.originalName}
            {field.required ? " *" : ""}
          </label>
        )}
        {renderFieldInput(field, onChange)}
        {showReset &&
          !field.readonly &&
          !field.disabled &&
          field.value &&
          field.value.length > 0 && (
            <i
              title={clearLabel}
              onClick={() => onChange(field.name, "", true)}
              aria-label="Clear"
              className="clear-input fa fa-times"
            ></i>
          )}
        <ToastContainer />
      </div>
    );
  }
);
