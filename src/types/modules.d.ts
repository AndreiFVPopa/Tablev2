declare module "*.module.scss" {
  const classes: Record<string, string>;
  export default classes;
}
declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}
declare module "*.scss";
declare module "*.css";
declare module "*.json" {
  const value: unknown;
  export default value;
}
