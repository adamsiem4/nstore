export type Product = {
  id: string;
  name: string;
  description: string;
  /** whole US dollars — switch to integer cents before real payments */
  price: number;
};
