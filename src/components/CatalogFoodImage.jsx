import { getMacroImage } from "../utils/catalog";

export default function CatalogFoodImage({ food, className = "" }) {
  const fallback = getMacroImage(food);
  const image = food.image || food.imageUrl || fallback;
  return (
    <span className={`catalog-food-image ${className}`}>
      <img
        src={image}
        alt=""
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = fallback;
        }}
      />
    </span>
  );
}
