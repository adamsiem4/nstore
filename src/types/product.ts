export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  /** whole euros — switch to integer cents before real payments */
  price: number;
};
