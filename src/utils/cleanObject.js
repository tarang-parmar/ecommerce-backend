import _ from "lodash";

export const cleanObject = (obj) => {
  return _.pickBy(
    obj,
    (value) => value !== undefined && value !== null && value !== ""
  );
};
