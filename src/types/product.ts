export type Product = {
  id: string;
  name: string;
  description: string;
  /** whole euros — switch to integer cents before real payments */
  price: number;
};
