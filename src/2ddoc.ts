/* eslint-disable camelcase */
const ALPHA = {
  regex: 'A-Z\\-\\./ ',
  parse: (s: string) => s
}
const ALPHANUM = {
  regex: '0-9A-Z\\-\\./ ',
  parse: (s: string) => s
}
const NUM = {
  regex: '0-9',
  parse: (s: string) => parseInt(s)
}
const DATE = {
  regex: '0-9',
  parse: (s: string) => {
    const day = s.substr(0, 2)
    const month = s.substr(2, 2)
    const year = s.substr(4, 4)
    const hours = s.substr(8, 2) || '12'
    const minutes = s.substr(10, 2) || '00'
    return new Date(`${year}/${month}/${day} ${hours}:${minutes}`)
  }
}

const CERTIFICATE_AUTHORITIES = new Map<string, string>([
  ['FR01', 'AriadNEXT'],
  ['FR02', 'LEX PERSONA'],
  ['FR03', 'Dhimyotis'],
  ['FR04', 'AriadNEXT'],
  ['FR05', 'ANTS']
])

export function getCertificateAuthority (certificateAuthorityId: string): string {
  return CERTIFICATE_AUTHORITIES.get(certificateAuthorityId) ?? 'Unknown'
}

const PUBLIC_KEYS = new Map<string, string>([
  ['AHP1', 'APHP'],
  ['AHP2', 'APHP'],
  ['AV01', 'CNAM'],
  ['AV02', 'CNAM']
])

export function getPublicKey (publicKeyId: string): string {
  return PUBLIC_KEYS.get(publicKeyId) ?? 'Unknown'
}

export function getSex (sex: string): string {
  switch (sex) {
    case 'M':
      return 'Men'
    case 'F':
      return 'Women'
    default:
      return 'Unknown'
  }
}

export function getAnalysisResult (analysisResult: string): string {
  switch (analysisResult) {
    case 'P':
      return 'Positive'
    case 'N':
      return 'Negative'
    case 'X':
      return 'Non-compliant sample'
    default:
      return 'Undetermined'
  }
}

type PossibleFieldType = Date | string | number;

interface Field<T extends PossibleFieldType> {
readonly code: string;
readonly name: string;
readonly minlen: number;
readonly maxlen: number;
readonly type: { readonly regex: string; parse: (x: string) => T };
}

function fieldRegex<T extends PossibleFieldType> (f: Field<T>): string {
  const chars = f.type.regex
  const terminator = f.minlen !== f.maxlen ? '[\\x1D\\x1E]' : ''
  return `${f.code}(?<${f.name}>[${chars}]{${f.minlen},${f.maxlen}})${terminator}`
}

const TEST_FIELDS = [
  { code: 'F0', name: 'tested_first_name', minlen: 0, maxlen: 60, type: ALPHA },
  { code: 'F1', name: 'tested_last_name', minlen: 0, maxlen: 38, type: ALPHA },
  { code: 'F2', name: 'tested_birth_date', minlen: 8, maxlen: 8, type: DATE },
  { code: 'F3', name: 'sex', minlen: 1, maxlen: 1, type: ALPHA },
  { code: 'F4', name: 'analysis_code', minlen: 3, maxlen: 7, type: ALPHANUM },
  { code: 'F5', name: 'analysis_result', minlen: 1, maxlen: 1, type: ALPHA },
  { code: 'F6', name: 'analysis_datetime', minlen: 12, maxlen: 12, type: DATE }
] as const

const VACCINE_FIELDS = [
  { code: 'L0', name: 'vaccinated_last_name', minlen: 0, maxlen: 80, type: ALPHA },
  { code: 'L1', name: 'vaccinated_first_name', minlen: 0, maxlen: 80, type: ALPHA },
  { code: 'L2', name: 'vaccinated_birth_date', minlen: 8, maxlen: 8, type: DATE },
  { code: 'L3', name: 'disease', minlen: 0, maxlen: 30, type: ALPHANUM },
  { code: 'L4', name: 'prophylactic_agent', minlen: 5, maxlen: 15, type: ALPHANUM },
  { code: 'L5', name: 'vaccine', minlen: 5, maxlen: 30, type: ALPHANUM },
  { code: 'L6', name: 'vaccine_maker', minlen: 5, maxlen: 30, type: ALPHANUM },
  { code: 'L7', name: 'doses_received', minlen: 1, maxlen: 1, type: NUM },
  { code: 'L8', name: 'doses_expected', minlen: 1, maxlen: 1, type: NUM },
  { code: 'L9', name: 'last_dose_date', minlen: 8, maxlen: 8, type: DATE },
  { code: 'LA', name: 'cycle_state', minlen: 2, maxlen: 2, type: ALPHA }
] as const

type FIELDS_TYPES = typeof TEST_FIELDS | typeof VACCINE_FIELDS;
type OBJECT_WITH_FIELDS<FIELDS extends FIELDS_TYPES> = {
[T in FIELDS[number] as T['name']]: ReturnType<T['type']['parse']>;
};

export type TestCertificate = OBJECT_WITH_FIELDS<typeof TEST_FIELDS>;
export type VaccineCertificate = OBJECT_WITH_FIELDS<typeof VACCINE_FIELDS>;
interface HeaderData {
code: string;
creation_date?: Date;
signature_date?: Date;
certificate_authority_id: string;
public_key_id: string;
document_version: string;
document_type: string;
document_perimeter: string;
document_country: string;
}
export type Certificate2ddoc = (VaccineCertificate | TestCertificate) & HeaderData & { signature?: string };

function parse_2ddoc_date (date_str: string): Date | undefined {
  if (!date_str || date_str === 'FFFF') return undefined
  const days = parseInt(date_str, 16)
  const ms = days * 24 * 60 * 60 * 1000
  const jan_2001 = new Date('2000-01-01')
  return new Date(+jan_2001 + ms)
}

function extract_data<F extends FIELDS_TYPES> (
  code: string,
  fields: F,
  o: Record<string, string>
): OBJECT_WITH_FIELDS<F> & HeaderData {
  const document_data = Object.fromEntries(
    fields.map((f: Field<PossibleFieldType>) => {
      if (!(f.name in o)) throw new Error(`Missing data for field ${f.name}`)
      return [f.name, f.type.parse(o[f.name])]
    })
  ) as OBJECT_WITH_FIELDS<F>
  const header: HeaderData = {
    code,
    creation_date: parse_2ddoc_date(o.creation_date),
    signature_date: parse_2ddoc_date(o.signature_date),
    certificate_authority_id: o.certificate_authority_id,
    public_key_id: o.public_key_id,
    document_version: o.document_version,
    document_type: o.document_type,
    document_perimeter: o.document_perimeter,
    document_country: o.document_country
  }
  return { ...header, ...document_data, signature: o.signature }
}

const TEST_REGEX = TEST_FIELDS.map((x) => fieldRegex<PossibleFieldType>(x)).join('')
const VACCINE_REGEX = VACCINE_FIELDS.map((x) => fieldRegex<PossibleFieldType>(x)).join('')

const HEADER_REGEX =
'DC' +
'(?<document_version>[0-9]{2})' +
'(?<certificate_authority_id>[A-Z\\d]{4})' +
'(?<public_key_id>[A-Z\\d]{4})' +
'(?<creation_date>[A-Z\\d]{4})' +
'(?<signature_date>[A-Z\\d]{4})' +
'(?<document_type>[A-Z\\d]{2})' +
'(?<document_perimeter>[A-Z\\d]{2})' +
'(?<document_country>[A-Z]{2})'

const SIGNATURE_REGEX =
'\\x1F{1}' + '(?<signature>[A-Z\\d\\=]+)'

const TOTAL_REGEX = new RegExp(
`^(?<data>${HEADER_REGEX}(?:${VACCINE_REGEX}|${TEST_REGEX}))${SIGNATURE_REGEX}$`
)

function getCertificateInfo (cert: Certificate2ddoc): CommonCertificateInfo {
  if ('vaccinated_first_name' in cert) {
    return {
      type: 'vaccination',
      vaccination_date: cert.last_dose_date,
      prophylactic_agent: cert.prophylactic_agent,
      doses_received: cert.doses_received,
      doses_expected: cert.doses_expected,
      first_name: cert.vaccinated_first_name,
      last_name: cert.vaccinated_last_name,
      date_of_birth: cert.vaccinated_birth_date,
      code: cert.code,
      source: { format: '2ddoc', cert }
    }
  } else if ('tested_first_name' in cert) {
    return {
      type: 'test',
      test_date: cert.analysis_datetime,
      is_negative: cert.analysis_result === 'N',
      is_inconclusive: cert.analysis_result === 'X',
      first_name: cert.tested_first_name,
      last_name: cert.tested_last_name,
      date_of_birth: cert.tested_birth_date,
      code: cert.code,
      source: { format: '2ddoc', cert }
    }
  }
  throw new Error('Unsupported or empty certificate: ' + JSON.stringify(cert))
}

export async function parse (doc: string): Promise<CommonCertificateInfo> {
  const groups = doc.match(TOTAL_REGEX)?.groups
  if (!groups) throw new Error('Format de certificat invalide')
  const fields = groups.document_type === 'B2' ? TEST_FIELDS : VACCINE_FIELDS
  const raw_data = extract_data(doc, fields, groups)
  return getCertificateInfo(raw_data)
}

export interface CommonVaccineInfo {
  type: 'vaccination'
  vaccination_date: Date
  prophylactic_agent: string
  doses_received: number
  doses_expected: number
}

export interface CommonTestInfo {
  type: 'test';
  test_date: Date;
  is_negative: boolean;
  is_inconclusive: boolean;
}

export interface AllCommonInfo {
  first_name: string;
  last_name: string;
  date_of_birth: Date;
  code: string;
  source: { format: '2ddoc'; cert: Certificate2ddoc };
}

export type CommonCertificateInfo = AllCommonInfo & (CommonVaccineInfo | CommonTestInfo);
