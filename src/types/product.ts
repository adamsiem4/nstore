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

/** Everything the product page shows below the buy box; see product-details.ts. */
export type ProductDetails = {
  /** the three things worth knowing before buying, in reading order */
  highlights: { title: string; body: string }[];
  /** specification rows, rendered as a description list */
  specs: { label: string; value: string }[];
  materials: string[];
  inBox: string[];
  care: string;
};
