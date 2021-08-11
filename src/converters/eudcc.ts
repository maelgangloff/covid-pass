import cbor from 'cbor'
import zlib from 'zlib'
import base45 from 'base45'
import { EUDCC } from '../types/dgc-combined-schema'

export const EUDCC_PREFIX = 'HC1:'

const formatISODate = (date: Date) => date.toISOString().split('T')[0]

export type DecodedEUDCC = {
  header: {
    alg: number,
    kid: string
  },
  payload: {
    iss: string,
    iat: string,
    exp: string,
    hcert: EUDCC
  },
  sig: string
}

export function decodeEUDCC (hcert: string): DecodedEUDCC {
  if (!hcert.startsWith(EUDCC_PREFIX)) throw new Error(`QR content must starts with ${EUDCC_PREFIX}`)
  const { value } = cbor.decodeFirstSync(zlib.inflateSync(base45.decode(hcert.substr(EUDCC_PREFIX.length, hcert.length))))
  const rawPayload = cbor.decodeFirstSync(value[2])
  const rawHeader = cbor.decodeFirstSync(value[0])

  const header = { alg: rawHeader.get(1), kid: rawHeader.get(4).toString('base64') }
  const payload = {
    iss: rawPayload.get(1),
    iat: formatISODate(new Date(rawPayload.get(6) * 1E3)),
    exp: formatISODate(new Date(rawPayload.get(6) * 1E3)),
    hcert: rawPayload.get(-260).get(1)
  }

  return {
    header,
    payload,
    sig: value[3].toString('base64')
  }
}
