import StoreLayout from "./(store)/layout";
import StoreNotFound from "./(store)/not-found";

// Unmatched URLs skip route-group layouts, so wrap the store's 404 in its chrome here.
export default function NotFound() {
  return (
    <StoreLayout>
      <StoreNotFound />
    </StoreLayout>
  );
}
