import Axios from "axios";
import * as type from "./types";

export const fetchLangTags = () => (dispatch: any) => {
  Axios.get("/assets/langtags.json").then(strings => {
    dispatch({
      payload: strings,
      type: type.FETCH_LANGTAGS,
    });
  });
};

export const fetchScriptFonts = () => (dispatch: any) => {
  Axios.get("/assets/scripts.csv").then(lines => {
    dispatch({
      payload: lines,
      type: type.FETCH_SCRIPTFONTS,
    });
  });
};
