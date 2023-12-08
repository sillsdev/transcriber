// import FilterIcon from '@mui/icons-material/FilterList';
// import SelectAllIcon from '@mui/icons-material/SelectAll';
// import {iconMargin} from '.';

interface IFilterButton {
  filter: boolean;
  onFilter: () => void;
}
export function FilterButton({ filter, onFilter }: IFilterButton) {
  // const t: IAssignmentTableStrings = useSelector(
  //   assignmentSelector,
  //   shallowEqual
  // );
  return <></>;
  // return (
  //   <AltButton
  //     id="assignFilt"
  //     key="filter"
  //     aria-label={t.filter}
  //     onClick={onFilter}
  //     title={t.showHideFilter}
  //   >
  //     {t.filter}
  //     {filter ? (
  //       <SelectAllIcon sx={iconMargin} />
  //     ) : (
  //       <FilterIcon sx={iconMargin} />
  //     )}
  //   </AltButton>
  // );
}
