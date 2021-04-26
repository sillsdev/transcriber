import { IGridStrings } from '../model';

export const localizeGrid = (t: IGridStrings) => {
  const localizeFilter = {
    filterPlaceholder: t.filterPlaceholder,
    contains: t.contains,
    notContains: t.notcontains,
    startsWith: t.startsWith,
    endsWith: t.endsWith,
    equal: t.equal,
    notEqual: t.notEqual,
    greaterThan: t.greaterThan,
    greaterThanOrEqual: t.greaterThanOrEqual,
    lessThan: t.lessThan,
    lessThanOrEqual: t.lessThanOrEqual,
  };

  const localizePaging = {
    showAll: t.all,
    rowsPerPage: t.rowsPerPage,
    info: (parameters: { from: number; to: number; count: number }) =>
      t.pageInfo,
  };

  const localizeRowSummary = {
    avg: t.avg,
    count: t.count,
    max: t.max,
    min: t.min,
    sum: t.sum,
  };

  const localizeGroupingPanel = {
    groupByColumn: t.groupByColumn,
  };

  const localizeTableMessages = {
    noData: t.noData,
  };

  return {
    localizeFilter,
    localizeGroupingPanel,
    localizePaging,
    localizeRowSummary,
    localizeTableMessages,
  };
};
