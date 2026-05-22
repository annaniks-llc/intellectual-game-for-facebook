export type ContentLocale = {
  code: string;
  enabled: boolean;
  isDefault: boolean;
};

export type CountryLocalization = { locale: string; displayName: string };

export type AdminCountryRow = {
  code: string;
  enabledForGenerator: boolean;
  localizations: CountryLocalization[];
};

export type TeamLocalization = {
  locale: string;
  displayName: string;
  shortName: string;
};

export type Team = {
  id: string;
  canonicalName: string;
  crestUrl?: string;
  countryCode: string;
  localizations: TeamLocalization[];
};

export type AthleteLocalization = {
  locale: string;
  givenName: string;
  familyName: string;
};

export type AthletePhoto = {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
};

export type Athlete = {
  id: string;
  canonicalFirstName: string;
  canonicalLastName: string;
  teamId: string;
  position: string;
  active: boolean;
  localizations: AthleteLocalization[];
  photos: AthletePhoto[];
};

export type Position = {
  id: string;
  code: string;
  label: string;
  localeCode: string;
};

export type Template = {
  id: string;
  name: string;
  prompt: string;
  active: boolean;
};
