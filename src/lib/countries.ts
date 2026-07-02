export interface CountryOption {
  code: string;
  label: string;
}

export interface CountryRegion {
  id: string;
  label: string;
  countries: CountryOption[];
}

export const COUNTRY_REGIONS: CountryRegion[] = [
  {
    id: "americas",
    label: "Américas",
    countries: [
      { code: "AR", label: "Argentina" },
      { code: "BO", label: "Bolivia" },
      { code: "BR", label: "Brasil" },
      { code: "CA", label: "Canadá" },
      { code: "CL", label: "Chile" },
      { code: "CO", label: "Colombia" },
      { code: "CR", label: "Costa Rica" },
      { code: "CU", label: "Cuba" },
      { code: "DO", label: "Rep. Dominicana" },
      { code: "EC", label: "Ecuador" },
      { code: "SV", label: "El Salvador" },
      { code: "GT", label: "Guatemala" },
      { code: "HN", label: "Honduras" },
      { code: "MX", label: "México" },
      { code: "NI", label: "Nicaragua" },
      { code: "PA", label: "Panamá" },
      { code: "PY", label: "Paraguay" },
      { code: "PE", label: "Perú" },
      { code: "PR", label: "Puerto Rico" },
      { code: "UY", label: "Uruguay" },
      { code: "US", label: "Estados Unidos" },
      { code: "VE", label: "Venezuela" },
    ],
  },
  {
    id: "europe",
    label: "Europa",
    countries: [
      { code: "DE", label: "Alemania" },
      { code: "AT", label: "Austria" },
      { code: "BE", label: "Bélgica" },
      { code: "BG", label: "Bulgaria" },
      { code: "HR", label: "Croacia" },
      { code: "DK", label: "Dinamarca" },
      { code: "ES", label: "España" },
      { code: "FI", label: "Finlandia" },
      { code: "FR", label: "Francia" },
      { code: "GR", label: "Grecia" },
      { code: "HU", label: "Hungría" },
      { code: "IE", label: "Irlanda" },
      { code: "IT", label: "Italia" },
      { code: "NL", label: "Países Bajos" },
      { code: "NO", label: "Noruega" },
      { code: "PL", label: "Polonia" },
      { code: "PT", label: "Portugal" },
      { code: "GB", label: "Reino Unido" },
      { code: "RO", label: "Rumania" },
      { code: "SE", label: "Suecia" },
      { code: "CH", label: "Suiza" },
      { code: "CZ", label: "Rep. Checa" },
    ],
  },
  {
    id: "asia_pacific",
    label: "Asia y Pacífico",
    countries: [
      { code: "AU", label: "Australia" },
      { code: "CN", label: "China" },
      { code: "KR", label: "Corea del Sur" },
      { code: "AE", label: "Emiratos Árabes" },
      { code: "PH", label: "Filipinas" },
      { code: "HK", label: "Hong Kong" },
      { code: "IN", label: "India" },
      { code: "ID", label: "Indonesia" },
      { code: "IL", label: "Israel" },
      { code: "JP", label: "Japón" },
      { code: "MY", label: "Malasia" },
      { code: "NZ", label: "Nueva Zelanda" },
      { code: "PK", label: "Pakistán" },
      { code: "SG", label: "Singapur" },
      { code: "TH", label: "Tailandia" },
      { code: "TW", label: "Taiwán" },
      { code: "VN", label: "Vietnam" },
    ],
  },
  {
    id: "africa_me",
    label: "África y Medio Oriente",
    countries: [
      { code: "ZA", label: "Sudáfrica" },
      { code: "EG", label: "Egipto" },
      { code: "NG", label: "Nigeria" },
      { code: "KE", label: "Kenia" },
      { code: "MA", label: "Marruecos" },
      { code: "SA", label: "Arabia Saudita" },
      { code: "TR", label: "Turquía" },
    ],
  },
];

export const ALL_COUNTRIES: CountryOption[] = COUNTRY_REGIONS.flatMap(
  (r) => r.countries
);

export function isValidCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code.toUpperCase());
}

export function countryLabel(code: string): string {
  return ALL_COUNTRIES.find((c) => c.code === code)?.label || code;
}
