export const hasOwnProperty = Function.prototype.call.bind(Object.prototype.hasOwnProperty) as {
  (target: object, key: PropertyKey): boolean;
};
