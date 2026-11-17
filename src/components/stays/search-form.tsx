import { Search } from "lucide-react";
import Link from "next/link";
import { propertyAmenities } from "@/lib/properties/schema";
import { propertyTypes } from "@/lib/properties/search-index";
import { getStaysPath, type StaysDictionary, type StaysLocale } from "@/lib/stays/i18n";
import { staySortOptions, type StaySearch } from "@/lib/stays/search";
import { GuestCounters } from "./guest-counters";
import styles from "./stays.module.css";

const priceOptions = [100, 200, 300, 500, 700];
const countOptions = [1, 2, 3, 4];

type StaySearchFormProps = {
  areas: string[];
  dictionary: StaysDictionary;
  locale: StaysLocale;
  search: StaySearch;
  today: string;
};

/** Plain GET form: works without JavaScript and keeps the search in the URL. */
export function StaySearchForm({ areas, dictionary, locale, search, today }: StaySearchFormProps) {
  const t = dictionary.search;
  const home = dictionary.home;
  return (
    <form action={`${getStaysPath(locale)}#estancias`} className={styles.searchForm} method="get">
      <div className={styles.searchRow}>
        <label className={styles.searchField}>
          <span className={styles.searchLabel}>{t.area}</span>
          <select defaultValue={search.area} name="area">
            <option value="">{t.allAreas}</option>
            {areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.searchField}>
          <span className={styles.searchLabel}>{t.checkIn}</span>
          <input defaultValue={search.checkIn} min={today} name="checkIn" type="date" />
        </label>
        <label className={styles.searchField}>
          <span className={styles.searchLabel}>{t.checkOut}</span>
          <input defaultValue={search.checkOut} min={today} name="checkOut" type="date" />
        </label>
        <GuestCounters
          decreaseLabel={home.decrease}
          increaseLabel={home.increase}
          initialGuests={search.guests}
          initialPets={search.pets}
          labels={{ adults: home.adults, children: home.children, pets: t.pets }}
        />
        <button className={styles.searchButton} type="submit">
          <Search aria-hidden="true" size={18} />
          {t.submit}
        </button>
      </div>

      <details className={styles.filters}>
        <summary>{t.filters}</summary>
        <div className={styles.filtersBody}>
          <label className={styles.field}>
            <span>{t.maxPrice}</span>
            <select defaultValue={search.maxPrice ?? ""} name="maxPrice">
              <option value="">{t.anyPrice}</option>
              {priceOptions.map((price) => (
                <option key={price} value={price}>
                  {price}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>{t.type}</span>
            <select defaultValue={search.type ?? ""} name="type">
              <option value="">{t.anyType}</option>
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {dictionary.types[type]}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>{t.bedrooms}</span>
            <select defaultValue={String(search.bedrooms)} name="bedrooms">
              <option value="0">{t.any}</option>
              {countOptions.map((count) => (
                <option key={count} value={count}>
                  {count}+
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>{t.baths}</span>
            <select defaultValue={String(search.baths)} name="baths">
              <option value="0">{t.any}</option>
              {countOptions.map((count) => (
                <option key={count} value={count}>
                  {count}+
                </option>
              ))}
            </select>
          </label>
          <fieldset className={`${styles.field} ${styles.fieldset}`}>
            <legend>{t.amenities}</legend>
            <div className={styles.checkboxes}>
              {propertyAmenities.map((amenity) => (
                <label key={amenity}>
                  <input
                    defaultChecked={search.amenities.includes(amenity)}
                    name="amenities"
                    type="checkbox"
                    value={amenity}
                  />
                  {dictionary.amenities[amenity]}
                </label>
              ))}
            </div>
          </fieldset>
          <label className={styles.field}>
            <span>{t.sort}</span>
            <select defaultValue={search.sort} name="sort">
              {staySortOptions.map((sort) => (
                <option key={sort} value={sort}>
                  {dictionary.sort[sort]}
                </option>
              ))}
            </select>
          </label>
          <Link className={styles.textLink} href={getStaysPath(locale)}>
            {t.clear}
          </Link>
        </div>
      </details>
    </form>
  );
}
