import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import * as QueryString from "query-string";
import { toast, ToastContainer } from "react-toastify";
import { orderBy } from "natural-orderby";
import { find, remove } from "lodash";
import { useLocation } from "react-router-dom";

import { IAppContext } from "../app.context";
import {
  IConfigPage,
  IConfigMethods,
  IConfigGetAllMethod,
  IConfigPostMethod,
  IConfigPutMethod,
  IConfigDeleteMethod,
  IConfigInputField,
  IConfigCustomAction,
  IConfigGetSingleMethod,
  ICustomLabels,
  IConfigPagination,
  IConfigGraphMethod,
} from "../../common/models/config.model";
import {
  IPaginationState,
  IQueryPaginationState,
  IBodyPaginationState,
} from "../../common/models/states.model";
import { withAppContext } from "../withContext/withContext.comp";
import { Loader } from "../loader/loader.comp";
import { dataHelpers } from "../../helpers/data.helpers";
import { paginationHelpers } from "../../helpers/pagination.helpers";
import { Table } from "../table/table.comp";
import { Cards } from "../cards/cards.comp";
import { QueryParams } from "../queryParams/queryParams.comp";
import { Button } from "../button/button.comp";
import { FormPopup } from "../formPopup/formPopup.comp";
import { FilterField } from "../filterField/filterField.comp";
import {
  isQueryPaginationState,
  isBodyPaginationState,
} from "../../common/models/states.types.helper";
import {
  isQueryPagination,
  isBodyPagination,
} from "../../common/models/config.types.helper";
import locale from "../../common/locale";

import "react-toastify/dist/ReactToastify.css";
import "./page.scss";
import { GraphPopup } from "../graphPopup/graphPopup.comp";

interface ILoadedFields {
  fieldName: string;
  values: Array<string>;
}

interface IProps {
  context: IAppContext;
  loadedFields: ILoadedFields[];
}

interface IPopupProps {
  type: "add" | "update" | "action";
  title: string;
  config: IConfigPostMethod | IConfigPutMethod;
  submitCallback: (body: any, containFiles: boolean) => void;
  getSingleConfig?: IConfigGetSingleMethod;
  rawData?: {};
}

interface IGraphProps {
  title: string;
  config: IConfigGraphMethod;
  rawData?: {};
}

const buildInitQueryParamsAndPaginationState = (
  initQueryParams: IConfigInputField[],
  paginationConfig?: IConfigPagination
): {
  initQueryParams: IConfigInputField[];
  initialPagination?: IPaginationState;
} => {
  let initialPagination: IPaginationState | undefined = undefined;

  if (paginationConfig) {
    if (isQueryPagination(paginationConfig)) {
      initialPagination = {
        source: paginationConfig.source,
        type: paginationConfig.type,
        page: parseInt(paginationConfig.params?.page?.value || "1"),
        limit: parseInt(paginationConfig.params?.limit?.value || "10"),
        descending:
          paginationConfig.params?.descending?.value === "true" || false,
        hasPreviousPage: false,
        hasNextPage: false,
        sortBy: paginationConfig.params?.sortBy?.value,
      };

      if (!find(initQueryParams, { name: "page" })) {
        initQueryParams.push({
          name: paginationConfig?.params?.page?.name,
          label: paginationConfig?.params?.page?.label || "Page",
          value: initialPagination?.page,
        });
      }

      if (
        paginationConfig?.params?.limit &&
        !find(initQueryParams, { name: "limit" })
      ) {
        initQueryParams.push({
          name: paginationConfig.params.limit.name,
          label: paginationConfig.params.limit.label || "Limit",
          value: initialPagination?.limit,
        });
      }

      if (
        paginationConfig?.params?.descending &&
        !find(initQueryParams, { name: "descending" })
      ) {
        initQueryParams.push({
          name: paginationConfig.params.descending.name,
          label: paginationConfig.params.descending.label || "Descending",
          value: initialPagination?.descending,
        });
      }

      if (
        paginationConfig?.params?.sortBy &&
        !find(initQueryParams, { name: "sortBy" })
      ) {
        initQueryParams.push({
          name: paginationConfig.params.sortBy.name,
          label: "Sort by",
          value: initialPagination?.sortBy,
        });
      }
    } else if (isBodyPagination(paginationConfig)) {
      initialPagination = {
        source: "body",
        type: paginationConfig.type,
        hasNextPage: false,
        hasPreviousPage: false,
        next: null,
        previous: null,
        limit: parseInt(paginationConfig.params?.limit?.value || "10"),
      };

      if (
        paginationConfig?.params?.limit &&
        !find(initQueryParams, { name: "limit" })
      ) {
        initQueryParams.push({
          name: paginationConfig.params.limit.name,
          label: paginationConfig.params.limit.label || "Limit",
          value: initialPagination?.limit,
        });
      }
    } else {
      throw new Error("unrecognized pagination");
    }
  }

  return {
    initQueryParams,
    initialPagination,
  };
};

const PageComp = ({ context, loadedFields }: IProps) => {
  const { page }: any = useParams();
  const { push, location } = useHistory();
  const { activePage, error, setError, httpService, config } = context;
  const pageHeaders: any = activePage?.requestHeaders || {};
  const pageMethods: IConfigMethods | undefined = activePage?.methods;
  const customActions: IConfigCustomAction[] = activePage?.customActions || [];
  const getAllConfig: IConfigGetAllMethod | undefined = pageMethods?.getAll;
  const paginationConfig = getAllConfig?.pagination;
  const infiniteScroll = paginationConfig?.type === "infinite-scroll";
  const getSingleConfig: IConfigGetSingleMethod | undefined =
    pageMethods?.getSingle;
  const postConfig: IConfigPostMethod | undefined = pageMethods?.post;
  const graphConfig: IConfigGraphMethod | undefined = pageMethods?.graph;
  const putConfig: IConfigPutMethod | undefined = pageMethods?.put;
  const deleteConfig: IConfigDeleteMethod | undefined = pageMethods?.delete;
  const customLabels: ICustomLabels | undefined = {
    ...config?.customLabels,
    ...activePage?.customLabels,
  };
  const addItemLabel =
    customLabels?.buttons?.addItem ||
    "+ " + locale().add + " " + activePage?.itemName;
  const openGraphLabel = locale().graph + " " + activePage?.itemName;
  const addItemFormTitle =
    customLabels?.formTitles?.addItem ||
    locale().add + " " + activePage?.itemName;
  const editItemFormTitle =
    customLabels?.formTitles?.editItem ||
    locale().update + " " + activePage?.itemName;
  const graphTitle = locale().graph + " " + activePage?.itemName;
  const {
    initQueryParams,
    initialPagination,
  } = buildInitQueryParamsAndPaginationState(
    getAllConfig?.queryParams || [],
    paginationConfig
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [openedPopup, setOpenedPopup] = useState<null | IPopupProps>(null);
  const [openedGraph, setOpenedGraph] = useState<null | IGraphProps>(null);
  const [queryParams, setQueryParams] = useState<IConfigInputField[]>(
    initQueryParams
  );
  const [pagination, setPagination] = useState<IPaginationState | undefined>(
    initialPagination
  );
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("");

  function closeFormPopup(refreshData: boolean = false) {
    setOpenedPopup(null);

    if (refreshData === true) {
      if (pagination?.type === "infinite-scroll") {
        setItems([]);
        const updatedParams = [...queryParams];
        remove(updatedParams, (param) =>
          ["page", "limit"].includes(param.name)
        );
        setQueryParams(
          buildInitQueryParamsAndPaginationState(
            updatedParams,
            paginationConfig
          ).initQueryParams
        );
      } else {
        getAllRequest();
      }
    }
  }

  function closeGraph(refreshData: boolean = false) {
    setOpenedGraph(null);

    if (refreshData === true) {
      if (pagination?.type === "infinite-scroll") {
        setItems([]);
        const updatedParams = [...queryParams];
        remove(updatedParams, (param) =>
          ["page", "limit"].includes(param.name)
        );
        setQueryParams(
          buildInitQueryParamsAndPaginationState(
            updatedParams,
            paginationConfig
          ).initQueryParams
        );
      } else {
        getAllRequest();
      }
    }
  }

  async function openEditPopup(rawData: any) {
    const params: IPopupProps = {
      rawData,
      type: "update",
      title: editItemFormTitle,
      config: putConfig as IConfigPutMethod,
      getSingleConfig,
      submitCallback: async (body: any, containFiles: boolean) => {
        return await updateItem(body, rawData, containFiles);
      },
    };

    setOpenedPopup(params);
  }

  function openCustomActionPopup(rawData: any, action: IConfigCustomAction) {
    const params: IPopupProps = {
      rawData,
      type: "action",
      title: action.name || "Custom Action",
      config: action as IConfigCustomAction,
      submitCallback: async (body: any, containFiles: boolean) => {
        return await performAction(body, rawData, action, containFiles);
      },
    };
    setOpenedPopup(params);
  }

  async function openGraphPopup(graphConfig: IConfigGraphMethod) {
    const params: IGraphProps = {
      title: graphTitle,
      config: graphConfig,
    };

    setOpenedGraph(params);
  }

  async function performAction(
    body: any,
    rawData: any,
    action: IConfigCustomAction,
    containFiles: boolean
  ) {
    const { url, requestHeaders, actualMethod } = action;

    return await httpService.fetch({
      method: actualMethod || "put",
      origUrl: url,
      rawData,
      body: containFiles ? body : JSON.stringify(body),
      headers: {
        ...pageHeaders,
        ...(requestHeaders || {}),
        ...(containFiles ? {} : { "content-type": "application/json" }),
      },
      responseType: "boolean",
    });
  }

  function extractQueryParams(
    params: IConfigInputField[]
  ): IConfigInputField[] {
    if (!paginationConfig || isQueryPagination(paginationConfig)) {
      const parsedParams = QueryString.parse(location.search);
      const finalQueryParams = params.map((queryParam) => {
        if (typeof parsedParams[queryParam.name] !== "undefined") {
          queryParam.value =
            queryParam.type === "boolean"
              ? parsedParams[queryParam.name] === "true"
              : decodeURIComponent(parsedParams[queryParam.name] as any);
        } else {
          queryParam.value = queryParam.value || "";
        }
        return queryParam;
      });

      setPagination(getUpdatedPaginationState(finalQueryParams, null));

      return finalQueryParams;
    } else {
      return params;
    }
  }

  async function fetchPageData(params: {
    actualMethod: "get" | "put" | "post" | "patch" | "delete";
    url: string;
    requestHeaders?: any;
    dataPath: string;
    dataTransform: any;
    sortBy: any;
  }) {
    const result = await httpService.fetch({
      method: params.actualMethod || "get",
      origUrl: params.url,
      queryParams,
      headers: Object.assign({}, pageHeaders, params.requestHeaders || {}),
    });
    let extractedData = dataHelpers.extractDataByDataPath(
      result,
      params.dataPath
    );

    if (!extractedData) {
      throw new Error("Could not extract data from response.");
    }

    if (!Array.isArray(extractedData)) {
      throw new Error("Extracted data is invalid.");
    }

    if (typeof params.dataTransform === "function") {
      extractedData = await params.dataTransform(extractedData);
    }

    const orderedItems = orderBy(
      extractedData,
      typeof params.sortBy === "string" ? [params.sortBy] : params.sortBy || []
    );

    if (paginationConfig) {
      const total = paginationConfig.fields?.total
        ? dataHelpers.extractDataByDataPath(
            result,
            paginationConfig.fields.total.dataPath
          )
        : undefined;
      const newPaginationState = getUpdatedPaginationState(
        queryParams,
        result,
        total
      );
      if (newPaginationState) {
        setPagination(newPaginationState);
      }
    }

    if (infiniteScroll) {
      setItems([...items, ...orderedItems]);
    } else {
      setItems(orderedItems);
    }
  }

  async function getAllRequest() {
    if (infiniteScroll) {
      if (pagination) {
        if (isQueryPaginationState(pagination)) {
          if (pagination?.page !== 1) {
            setLoading(false);
          }
        } else if (isBodyPaginationState(pagination)) {
          if (pagination.previous) {
            setLoading(false);
          }
        } else {
          throw new Error("unrecognized pagination source");
        }
      }
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      if (!getAllConfig) {
        throw new Error("Get all method is not defined.");
      }

      if (paginationConfig && !pagination) {
        throw new Error("Pagination not initialized.");
      }

      const {
        url,
        requestHeaders,
        actualMethod,
        dataPath,
        sortBy,
        dataTransform,
      } = getAllConfig;
      await fetchPageData({
        actualMethod: actualMethod,
        url: url,
        requestHeaders: requestHeaders,
        dataPath: dataPath,
        dataTransform: dataTransform,
        sortBy: sortBy,
      });
    } catch (e) {
      setError(e.message);
    }

    setLoading(false);
  }

  async function addItem(body: any, containFiles?: boolean, queryParams?: []) {
    if (!postConfig) {
      throw new Error("Post method is not defined.");
    }

    const { url, requestHeaders, actualMethod } = postConfig;

    return await httpService.fetch({
      method: actualMethod || "post",
      origUrl: url,
      queryParams,
      body: containFiles ? body : JSON.stringify(body),
      headers: {
        ...pageHeaders,
        ...(requestHeaders || {}),
        ...(containFiles ? {} : { "content-type": "application/json" }),
      },
      responseType: "boolean",
    });
  }

  async function updateItem(body: any, rawData: any, containFiles?: boolean) {
    if (!putConfig) {
      throw new Error("Put method is not defined.");
    }

    const { url, requestHeaders, actualMethod } = putConfig;

    return await httpService.fetch({
      method: actualMethod || "put",
      origUrl: url,
      rawData,
      body: containFiles ? body : JSON.stringify(body),
      headers: {
        ...pageHeaders,
        ...(requestHeaders || {}),
        ...(containFiles ? {} : { "content-type": "application/json" }),
      },
      responseType: "boolean",
    });
  }

  async function deleteItem(item: any) {
    const approved: boolean = window.confirm(
      "Are you sure you want to delete this item?"
    );

    if (!approved) {
      return;
    }

    try {
      if (!deleteConfig) {
        throw new Error("Delete method is not defined.");
      }

      const { url, requestHeaders, actualMethod } = deleteConfig;
      const success = await httpService.fetch({
        method: actualMethod || "delete",
        origUrl: url,
        rawData: item,
        headers: Object.assign({}, pageHeaders, requestHeaders || {}),
        responseType: "boolean",
      });

      if (success) {
        if (pagination?.type === "infinite-scroll") {
          setItems([]);
          const updatedParams = [...queryParams];
          remove(updatedParams, (param) =>
            ["page", "limit"].includes(param.name)
          );
          setQueryParams(
            buildInitQueryParamsAndPaginationState(
              updatedParams,
              paginationConfig
            ).initQueryParams
          );
        } else {
          getAllRequest();
        }
      }
    } catch (e) {
      toast.error(e.message, {
        position: toast.POSITION.TOP_CENTER,
      });
    }
  }

  function submitQueryParams(
    updatedParams: IConfigInputField[],
    reset?: boolean
  ) {
    if (loading) {
      return;
    }

    if (reset) {
      setItems([]);
      remove(updatedParams, (param) => ["page", "limit"].includes(param.name));
      updatedParams = buildInitQueryParamsAndPaginationState(
        updatedParams,
        paginationConfig
      ).initQueryParams;
    }

    updatedParams.map((queryParam, idx) => {
      if (
        queryParam.type === "select" &&
        queryParam.value === locale().select
      ) {
        // default value means nothing was selected and thus we explicitly
        // empty out the value in this case; otherwise the string '-- Select --'
        // is used as the value for the given queryParams
        queryParam.value = "";
      }
    });

    setQueryParams(updatedParams);
    setPagination(getUpdatedPaginationState(updatedParams, null));

    let paramsToUrl = [...updatedParams];

    if (paginationConfig?.type === "infinite-scroll") {
      paramsToUrl = paramsToUrl.filter(
        (param) => !["page", "limit"].includes(param.name)
      );
    }

    // Building query string
    const queryState: string = paramsToUrl
      .map((queryParam, idx) => {
        return `${idx === 0 ? "?" : ""}${queryParam.name}=${encodeURIComponent(
          queryParam.value || ""
        )}`;
      })
      .join("&");

    // Pushing query state to url
    if (page && queryState) {
      push(queryState);
    }
  }

  function getUpdatedPaginationState(
    updatedParams: IConfigInputField[],
    result: any,
    total?: number
  ): IPaginationState | undefined {
    if (!paginationConfig) {
      return;
    }

    if (isQueryPagination(paginationConfig)) {
      if (pagination && !isQueryPaginationState(pagination)) {
        throw new Error("unexpected pagination source " + pagination.source);
      }
      const newState: IQueryPaginationState = pagination
        ? pagination
        : {
            source: "query",
            type: paginationConfig.type,
            page: parseInt(paginationConfig.params?.page?.value || "1"),
            limit: parseInt(paginationConfig.params?.limit?.value || "10"),
            descending:
              paginationConfig.params?.descending?.value === "true" || false,
            hasPreviousPage: false,
            hasNextPage: false,
            sortBy: paginationConfig.params?.sortBy?.value,
          };

      newState.total = total || pagination?.total;
      newState.page =
        parseInt(
          updatedParams.find(
            (param) => param.name === paginationConfig?.params?.page?.name
          )?.value
        ) || newState.page;
      newState.limit =
        parseInt(
          updatedParams.find(
            (param) => param.name === paginationConfig?.params?.limit?.name
          )?.value
        ) || newState.limit;
      newState.descending =
        updatedParams.find(
          (param) => param.name === paginationConfig?.params?.descending?.name
        )?.value === "true" || newState.descending;
      newState.sortBy =
        updatedParams.find(
          (param) => param.name === paginationConfig?.params?.sortBy?.name
        )?.value || newState.sortBy;
      newState.hasPreviousPage = paginationHelpers.hasPreviousPage(
        newState.page
      );
      newState.hasNextPage = paginationHelpers.hasNextPage(
        newState.page,
        newState.limit,
        newState.total
      );
      return newState;
    } else if (isBodyPagination(paginationConfig)) {
      if (pagination && !isBodyPaginationState(pagination)) {
        throw new Error("unexpected pagination source " + pagination.source);
      }
      const newState: IBodyPaginationState = pagination
        ? pagination
        : {
            source: "body",
            type: paginationConfig.type,
            next: result[paginationConfig.params.nextPath || locale().next],
            previous:
              result[paginationConfig.params.prevPath || locale().previous],
            hasNextPage: !!result[
              paginationConfig.params.nextPath || locale().next
            ],
            hasPreviousPage: !!result[
              paginationConfig.params.prevPath || locale().previous
            ],
            limit: parseInt(paginationConfig.params?.limit?.value || "10"),
            total: result[paginationConfig.params.countPath || "count"],
          };
      if (result) {
        newState.next =
          result[paginationConfig.params.nextPath || locale().next];
        newState.previous =
          result[paginationConfig.params.prevPath || locale().previous];
        newState.hasNextPage = !!result[
          paginationConfig.params.nextPath || locale().next
        ];
        newState.hasPreviousPage = !!result[
          paginationConfig.params.prevPath || locale().previous
        ];
        newState.total = result[paginationConfig.params.countPath || "count"];
      }
      newState.limit =
        parseInt(
          updatedParams.find(
            (param) => param.name === paginationConfig?.params?.limit?.name
          )?.value
        ) || newState.limit;
      return newState;
    } else {
      throw new Error("unrecognized pagination source");
    }
  }

  function renderItemsUI() {
    if (loading) {
      return <Loader />;
    }

    const fields = getAllConfig?.fields || getAllConfig?.display?.fields || [];
    const fieldsToFilter = fields
      .filter((field) => field.filterable)
      .map((field) => field.name);
    let filteredItems = items;

    if (filter && fieldsToFilter.length) {
      filteredItems = items.filter((item) => {
        let passFilter = false;
        fieldsToFilter.forEach((fieldName) => {
          const value = item[fieldName];
          if (
            typeof value === "string" &&
            value.toLowerCase().indexOf(filter) >= 0
          ) {
            passFilter = true;
          }
        });
        return passFilter;
      });
    }

    if (!filteredItems.length) {
      return <div className="app-error">{locale().nothing_to_see}</div>;
    }

    const getNextPage = paginationConfig
      ? () => {
          if (isQueryPagination(paginationConfig)) {
            if (pagination && !isQueryPaginationState(pagination)) {
              throw new Error(
                "unexpected pagination source " + pagination.source
              );
            }
            if (pagination?.page && queryParams.length > 0) {
              const newPage = pagination?.page + 1;
              const updatedParams = queryParams.map((param) => {
                if (param.name === paginationConfig.params?.page?.name) {
                  return {
                    ...param,
                    value: newPage,
                  };
                }
                return param;
              });
              submitQueryParams(updatedParams);
            }
          } else if (isBodyPagination(paginationConfig)) {
            if (pagination && !isBodyPaginationState(pagination)) {
              throw new Error(
                "unexpected pagination source " + pagination.source
              );
            }
            if (!getAllConfig || !pagination?.next) {
              return;
            }
            const {
              requestHeaders,
              actualMethod,
              dataPath,
              sortBy,
              dataTransform,
            } = getAllConfig;
            fetchPageData({
              actualMethod: actualMethod,
              url: pagination.next,
              requestHeaders: requestHeaders,
              dataPath: dataPath,
              dataTransform: dataTransform,
              sortBy: sortBy,
            });
          } else {
            throw new Error("unrecognized pagination source");
          }
        }
      : null;

    const getPreviousPage = paginationConfig
      ? () => {
          if (isQueryPagination(paginationConfig)) {
            if (pagination && !isQueryPaginationState(pagination)) {
              throw new Error(
                "unexpected pagination source " + pagination.source
              );
            }
            if (
              pagination?.page &&
              pagination.page > 1 &&
              queryParams.length > 0
            ) {
              const newPage = pagination?.page - 1;
              const updatedParams = queryParams.map((param) => {
                if (param.name === paginationConfig.params?.page?.name) {
                  return {
                    ...param,
                    value: newPage,
                  };
                }
                return param;
              });
              submitQueryParams(updatedParams);
            }
          } else if (isBodyPagination(paginationConfig)) {
            if (pagination && !isBodyPaginationState(pagination)) {
              throw new Error(
                "unexpected pagination source " + pagination.source
              );
            }
            if (!getAllConfig || !pagination?.previous) {
              return;
            }
            const {
              requestHeaders,
              actualMethod,
              dataPath,
              sortBy,
              dataTransform,
            } = getAllConfig;
            fetchPageData({
              actualMethod: actualMethod,
              url: pagination.previous,
              requestHeaders: requestHeaders,
              dataPath: dataPath,
              dataTransform: dataTransform,
              sortBy: sortBy,
            });
          } else {
            throw new Error("unrecognized pagination source");
          }
        }
      : null;

    const callbacks = {
      delete: deleteConfig ? deleteItem : null,
      put: putConfig ? openEditPopup : null,
      action: customActions.length ? openCustomActionPopup : () => {},
      getNextPage,
      getPreviousPage,
    };

    if (getAllConfig?.display.type === "cards") {
      return (
        <Cards
          pagination={pagination}
          callbacks={callbacks}
          fields={fields}
          items={filteredItems}
          customActions={customActions}
          customLabels={customLabels}
        />
      );
    }

    return (
      <Table
        pagination={pagination}
        callbacks={callbacks}
        fields={fields}
        items={filteredItems}
        customActions={customActions}
        customLabels={customLabels}
      />
    );
  }

  function renderPaginationStateLabel() {
    if (loading || !items.length) {
      return;
    }

    if (!pagination || isQueryPaginationState(pagination)) {
      const currentCountFrom =
        ((pagination?.page || 1) - 1) * (pagination?.limit || 10) + 1;
      const currentCountTo = currentCountFrom + items.length - 1;
      let label: string = `${
        locale().showing_result
      } ${currentCountFrom}-${currentCountTo} ${locale().out_of} ${
        pagination?.total
      } ${locale().items}`;

      if (pagination?.type === "infinite-scroll") {
        label = `Showing ${pagination?.total} items`;
      }

      if (customLabels?.pagination?.itemsCount) {
        label = customLabels?.pagination?.itemsCount
          .replace(":currentCountFrom", currentCountFrom as any)
          .replace(":currentCountTo", currentCountFrom as any)
          .replace(":totalCount", pagination?.total as any);
      }

      return <p className="center pagination-state">{label}</p>;
    }
    if (isBodyPaginationState(pagination)) {
      // TODO: extract start end end in a meaningful manner from the API
      // this is not something that id based pagination APIs support generally
      let label: string = `Total Results: ${pagination?.total}`;
      if (pagination?.type === "infinite-scroll") {
        label = `Showing ${pagination?.total} items`;
      }

      if (customLabels?.pagination?.itemsCount) {
        label = customLabels?.pagination?.itemsCount.replace(
          ":totalCount",
          pagination?.total as any
        );
      }

      return <p className="center pagination-state">{label}</p>;
    }
  }

  function renderPageContent() {
    const fields = getAllConfig?.fields || getAllConfig?.display?.fields || [];
    const fieldsToFilter = fields
      .filter((field) => field.filterable)
      .map((field) => field.name);

    return (
      <React.Fragment>
        <QueryParams
          initialParams={queryParams}
          paginationConfig={paginationConfig}
          submitCallback={submitQueryParams}
        />
        {fieldsToFilter.length > 0 && <FilterField onChange={setFilter} />}
        {pagination?.total && renderPaginationStateLabel()}
        {error ? <div className="app-error">{error}</div> : renderItemsUI()}
      </React.Fragment>
    );
  }

  useEffect(() => {
    const nextActivePage: IConfigPage | null =
      context?.config?.pages?.filter(
        (p, pIdx) => p.id === page || pIdx + 1 === parseInt(page || "")
      )[0] || null;
    context.setActivePage(nextActivePage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (
      config?.pages
        .map((e) => e.id)
        .includes(location.pathname.substring(1)) === false
    ) {
      document.location.replace("#/404");
    }
    if (
      activePage?.accessedBy.includes(
        sessionStorage.getItem("diten-user-role") || ""
      ) === false
    ) {
      document.location.replace("#/unauthorized");
    }

    const {
      initQueryParams,
      initialPagination,
    } = buildInitQueryParamsAndPaginationState(
      getAllConfig?.queryParams || [],
      paginationConfig
    );

    setItems([]);
    setQueryParams(extractQueryParams(initQueryParams));
    setPagination(initialPagination);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage]);

  useEffect(() => {
    // Load data when query params
    if (
      config?.pages
        .map((e) => e.id)
        .includes(location.pathname.substring(1)) === false
    ) {
      document.location.replace("#/404");
    }

    if (
      activePage?.accessedBy.includes(
        sessionStorage.getItem("diten-user-role") || ""
      ) === false
    ) {
      document.location.replace("#/unauthorized");
    }
    getAllRequest();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  return (
    <div className="app-page">
      <header className="app-page-header">
        <hgroup>
          <h2>{activePage?.name}</h2>
          {activePage?.description && <h4>{activePage?.description}</h4>}
        </hgroup>
        {graphConfig && (
          <Button
            className="add-item"
            color="blue"
            onClick={() => openGraphPopup(graphConfig)}
          >
            {openGraphLabel}
          </Button>
        )}
        {postConfig && (
          <Button
            className="add-item"
            color="green"
            onClick={() =>
              setOpenedPopup({
                type: "add",
                title: addItemFormTitle,
                config: postConfig,
                submitCallback: addItem,
              })
            }
          >
            {addItemLabel}
          </Button>
        )}
      </header>
      <hr />
      <main className="app-page-content">{renderPageContent()}</main>
      {openedPopup && (
        <FormPopup
          title={openedPopup.title}
          closeCallback={closeFormPopup}
          submitCallback={openedPopup.submitCallback}
          type={openedPopup.type}
          fields={openedPopup.config?.fields || []}
          loadedFields={loadedFields}
          rawData={openedPopup.rawData}
          getSingleConfig={openedPopup.getSingleConfig}
          methodConfig={openedPopup.config}
        />
      )}
      {openedGraph && (
        <GraphPopup
          title={openedGraph.title}
          closeCallback={closeGraph}
          fields={openedGraph.config?.fields || []}
          graphConfig={openedGraph.config}
        />
      )}
      <ToastContainer />
    </div>
  );
};

export const Page = withAppContext(PageComp);
