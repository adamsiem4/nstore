export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  /** dominant colourway of the shot, sampled from the image — card swatch */
  color: string;
  /** whole euros — switch to integer cents before real payments */
  price: number;
};
