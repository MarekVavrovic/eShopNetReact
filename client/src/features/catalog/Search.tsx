import { debounce, TextField } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../app/store/store";
import { setSearchTerm } from "./catalogSlice";
import { useMemo, useState } from "react";

export default function Search() {
  const { searchTerm } = useAppSelector((state) => state.catalog);
  const dispatch = useAppDispatch();
  const [term, setTerm] = useState(searchTerm); 

  // Memoized so a new debounce isn't created on every render
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        dispatch(setSearchTerm(value));
      }, 1000),
    [dispatch]
  );

  return (
    <TextField
      label="Search products"
      variant="outlined"
      fullWidth
      type="search"
      value={term}
      onChange={(e) => {
        setTerm(e.target.value);         // updates input immediately
        debouncedSearch(e.target.value); // dispatches to Redux after 1s
      }}
    />
  );
}