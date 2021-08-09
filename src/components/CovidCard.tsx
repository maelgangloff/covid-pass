import React from 'react'
import '../style/card.scss'
import base45 from 'base45'
import zlib from 'zlib'
import cbor from 'cbor'
import { EUDCC } from '../types/dgc-combined-schema'
import QRCode from 'qrcode.react'
import crypto from 'crypto'

type DecodedQRCode = {
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

interface Props {
  hcert: string
}

interface State {
  hcert: DecodedQRCode | null
}

function decodeQRCode (hcert: string): DecodedQRCode | null {
  if (!hcert.startsWith('HC1:')) throw new Error('QR content must starts with HC1.')
  try {
    const { value } = cbor.decodeFirstSync(zlib.inflateSync(base45.decode(hcert.substr(4, hcert.length))))
    const rawPayload = cbor.decodeFirstSync(value[2])
    const rawHeader = cbor.decodeFirstSync(value[0])

    const header = { alg: rawHeader.get(1), kid: rawHeader.get(4).toString('base64') }
    const payload = {
      iss: rawPayload.get(1),
      iat: new Date(rawPayload.get(6) * 1000).toISOString(),
      exp: new Date(rawPayload.get(4) * 1000).toISOString(),
      hcert: rawPayload.get(-260).get(1)
    }

    return {
      header,
      payload,
      sig: value[3].toString('base64')
    }
  } catch (e) {
    return null
  }
}

export class CovidCard extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = { hcert: decodeQRCode(props.hcert) }
  }

  render () {
    const { hcert } = this.state
    if (hcert === null) return <></>
    const { payload: { hcert: certificate } } = hcert
    const passType = 'v' in certificate ? 'VACCINATION' : 't' in certificate ? 'TEST' : 'RECOVERY'
    const certData = passType === 'VACCINATION' ? certificate.v : passType === 'TEST' ? certificate.t : certificate.r
    if (certData === undefined) return <></>
    const [cert] = certData
    return <table>
      <tbody>
      <tr>
        <td>
          <h4>EU Digital COVID Certificate</h4>
          {<QRCode value={this.props.hcert} renderAs="svg" level="L" size={100}/>}
          <p className="name">{certificate?.nam?.gn} {certificate?.nam?.fn}</p>
          <p>Date of birth {certificate.dob}</p>
        </td>
        <td>
          <h2>{passType}</h2>
          <table className="infos">
            <tbody>
            <tr>
              <td>Unique certificate identifier</td>
              <td className="uci">{cert.ci as string}</td>
            </tr>
            <tr>
              <td>Certificate issuer</td>
              <td>{cert.is as string}</td>
            </tr>
            <tr>
              <td>Country of {passType === 'VACCINATION' ? 'vaccination' : 'test'}</td>
              <td>{cert.co as string}</td>
            </tr>
            {
              'v' in certificate && <>
                <tr>
                  <td>Disease or agent targeted</td>
                  <td>{cert.tg as string}</td>
                </tr>
                <tr>
                  <td>Vaccine or prophylaxis</td>
                  <td>{cert.vp as string}</td>
                </tr>
                <tr>
                  <td>Vaccine product</td>
                  <td>{cert.mp as string}</td>
                </tr>
                <tr>
                  <td>Vaccine marketing authorization holder</td>
                  <td>{cert.ma as string}</td>
                </tr>
                <tr>
                  <td>Number in a series of doses</td>
                  <td>{cert.dn as string}</td>
                </tr>
                <tr>
                  <td>The overall number of doses</td>
                  <td>{cert.sd as string}</td>
                </tr>
                <tr>
                  <td>Date of vaccination</td>
                  <td>{cert.dt as string}</td>
                </tr>
              </>
            }
            {
              't' in certificate && <>
                <tr>
                  <td>Disease or agent targeted</td>
                  <td>{cert.tg as string}</td>
                </tr>
                <tr>
                  <td>The type of test</td>
                  <td>{cert.tt as string}</td>
                </tr>
                <tr>
                  <td>The name of the NAAT used</td>
                  <td>{cert.nm as string}</td>
                </tr>
                <tr>
                  <td>The device identifier of the RAT used</td>
                  <td>{cert.ma as string}</td>
                </tr>
                <tr>
                  <td>Date and time of the test sample collection</td>
                  <td>{cert.sc as string}</td>
                </tr>
                <tr>
                  <td>Result of the test</td>
                  <td>{cert.tr as string}</td>
                </tr>
                <tr>
                  <td>Testing centre or facility</td>
                  <td>{cert.tc as string}</td>
                </tr>
              </>
            }
            {
              'r' in certificate && <>
                <tr>
                  <td>Disease or agent targeted</td>
                  <td>{cert.tg as string}</td>
                </tr>
                <tr>
                  <td>Date of the holder&rsquo;s first positive</td>
                  <td>{cert.fr as string}</td>
                </tr>
                <tr>
                  <td>Certificate issuer</td>
                  <td>{cert.is as string}</td>
                </tr>
                <tr>
                  <td>Certificate valid from</td>
                  <td>{cert.df as string}</td>
                </tr>
                <tr>
                  <td>Certificate valid until</td>
                  <td>{cert.du as string}</td>
                </tr>
              </>
            }
            </tbody>
          </table>
          <p
            className="fingerprint">{crypto.createHash('sha256').update(cert.co.toUpperCase() + cert.ci).digest('hex')}</p>
        </td>
      </tr>
      </tbody>
    </table>
  }
}
