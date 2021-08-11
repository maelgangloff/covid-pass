/* eslint-disable no-unused-vars */
import React from 'react'
import '../style/card.scss'
import { RecoveryEntry, TestEntry, VaccinationEntry } from '../types/dgc-combined-schema'

import {
  getCertificateAuthority,
  getPublicKey,
  VaccineCertificate,
  CommonCertificateInfo,
  TestCertificate, getAnalysisResult, getSex, decode2DDoc
} from '../converters/2ddoc'
import bwipjs from 'bwip-js'
import * as crypto from 'crypto'
import { DecodedEUDCC, decodeEUDCC, EUDCC_PREFIX } from '../converters/eudcc'

export enum DocType {
  EUDCC,
  DDOC
}

interface Props {
  data: string
}

interface State {
  eudcc?: DecodedEUDCC
  ddoc?: CommonCertificateInfo
  docType: DocType
}

type PassType = 'VACCINATION' | 'TEST' | 'RECOVERY'

const formatISODate = (date: Date) => date.toISOString().split('T')[0]
const formatISODateTime = (date: Date) => date.toISOString().split('.')[0]

function EUCCInfoTable (passType: PassType, eudcc?: VaccinationEntry | TestEntry | RecoveryEntry) {
  return <>
    <tr>
      <td>Unique certificate identifier</td>
      <td className="uci">{eudcc?.ci}</td>
    </tr>
    <tr>
      <td>Certificate issuer</td>
      <td>{eudcc?.is}</td>
    </tr>
    <tr>
      <td>Country of {passType === 'VACCINATION' ? 'vaccination' : 'test'}</td>
      <td>{eudcc?.co}</td>
    </tr>
    {
      passType === 'VACCINATION' && <>
        <tr>
          <td>Disease or agent targeted</td>
          <td>{eudcc?.tg}</td>
        </tr>
        <tr>
          <td>Vaccine or prophylaxis</td>
          <td>{eudcc?.vp as string}</td>
        </tr>
        <tr>
          <td>Vaccine product</td>
          <td>{eudcc?.mp as string}</td>
        </tr>
        <tr>
          <td>Vaccine marketing authorization holder</td>
          <td>{eudcc?.ma as string}</td>
        </tr>
        <tr>
          <td>Number in a series of doses</td>
          <td>{eudcc?.dn as string}</td>
        </tr>
        <tr>
          <td>The overall number of doses</td>
          <td>{eudcc?.sd as string}</td>
        </tr>
        <tr>
          <td>Date of vaccination</td>
          <td>{eudcc?.dt as string}</td>
        </tr>
      </>
    }
    {
      passType === 'TEST' && <>
        <tr>
          <td>Disease or agent targeted</td>
          <td>{eudcc?.tg}</td>
        </tr>
        <tr>
          <td>The type of test</td>
          <td>{eudcc?.tt as string}</td>
        </tr>
        <tr>
          <td>The name of the NAAT used</td>
          <td>{eudcc?.nm as string}</td>
        </tr>
        <tr>
          <td>The device identifier of the RAT used</td>
          <td>{eudcc?.ma as string}</td>
        </tr>
        <tr>
          <td>Date and time of the test sample collection</td>
          <td>{eudcc?.sc as string}</td>
        </tr>
        <tr>
          <td>Result of the test</td>
          <td>{eudcc?.tr as string}</td>
        </tr>
        <tr>
          <td>Testing centre or facility</td>
          <td>{eudcc?.tc as string}</td>
        </tr>
      </>
    }
    {
      passType === 'RECOVERY' && <>
        <tr>
          <td>Disease or agent targeted</td>
          <td>{eudcc?.tg}</td>
        </tr>
        <tr>
          <td>Date of the holder&rsquo;s first positive</td>
          <td>{eudcc?.fr as string}</td>
        </tr>
        <tr>
          <td>Certificate valid from</td>
          <td>{eudcc?.df as string}</td>
        </tr>
        <tr>
          <td>Certificate valid until</td>
          <td>{eudcc?.du as string}</td>
        </tr>
      </>
    }
  </>
}

function DDOCInfoTable (ddoc: CommonCertificateInfo) {
  return <>
    <tr>
      <td>Issuing country</td>
      <td>{ddoc.source.cert.document_country}</td>
    </tr>
    <tr>
      <td>Certificate authority</td>
      <td>{getCertificateAuthority(ddoc.source.cert.certificate_authority_id)}</td>
    </tr>
    <tr>
      <td>Encryption key</td>
      <td>{getPublicKey(ddoc.source.cert.public_key_id)}</td>
    </tr>
    <tr>
      <td>Signature date</td>
      <td>{formatISODate(ddoc.source.cert.signature_date as Date)}</td>
    </tr>
    <tr>
      <td>Type of document</td>
      <td>{ddoc.source.cert.document_type}</td>
    </tr>
    {
      ddoc?.type === 'vaccination'
        ? <>
        <tr>
          <td>Doses received</td>
          <td>{ddoc.doses_received}</td>
        </tr>
        <tr>
          <td>Doses expected</td>
          <td>{ddoc.doses_expected}</td>
        </tr>
        <tr>
          <td>Prophylactic agent</td>
          <td>{ddoc.prophylactic_agent}</td>
        </tr>
        <tr>
          <td>Date of vaccination</td>
          <td>{formatISODate((ddoc.source.cert as VaccineCertificate).last_dose_date)}</td>
        </tr>
        <tr>
          <td>Vaccination cycle state</td>
          <td>{(ddoc.source.cert as VaccineCertificate).cycle_state}</td>
        </tr>
        <tr>
          <td>Disease</td>
          <td>{(ddoc.source.cert as VaccineCertificate).disease}</td>
        </tr>
        <tr>
          <td>Vaccine name</td>
          <td>{(ddoc.source.cert as VaccineCertificate).vaccine}</td>
        </tr>
        <tr>
          <td>Vaccine manufacturer</td>
          <td>{(ddoc.source.cert as VaccineCertificate).vaccine_maker}</td>
        </tr>
      </>
        : <>
        <tr>
          <td>Gender</td>
          <td>{getSex((ddoc.source.cert as TestCertificate).sex)}</td>
        </tr>
        <tr>
          <td>Analysis code</td>
          <td>{(ddoc.source.cert as TestCertificate).analysis_code}</td>
        </tr>
        <tr>
          <td>Analysis date/time</td>
          <td>{ formatISODateTime((ddoc.source.cert as TestCertificate).analysis_datetime) }</td>
        </tr>
        <tr>
          <td>Result</td>
          <td>{getAnalysisResult((ddoc.source.cert as TestCertificate).analysis_result)}</td>
        </tr>
      </>
    }
  </>
}

export class CovidCard extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      docType: props.data.trim().startsWith(EUDCC_PREFIX) ? DocType.EUDCC : DocType.DDOC
    }
  }

  componentDidMount () {
    try {
      switch (this.state.docType) {
        case DocType.EUDCC:
          this.setState({ eudcc: decodeEUDCC(this.props.data.trim()) })
          break
        case DocType.DDOC:
          decode2DDoc(this.props.data.trim()).then(ddoc => this.setState({ ddoc }))
          break
        default:
          throw new Error('Not a certificate.')
      }
    } catch (e) {
      console.error(e)
    }
  }

  render () {
    if (typeof this.state.eudcc === 'undefined' && typeof this.state.ddoc === 'undefined') {
      return <>
      <canvas className="bwipjs"/>
    </>
    }
    const passType = this.state.docType === DocType.DDOC ? this.state.ddoc?.type.toUpperCase() as PassType : this.state.eudcc?.payload.hcert ? 'v' in this.state.eudcc?.payload.hcert ? 'VACCINATION' : 't' in this.state.eudcc?.payload.hcert ? 'TEST' : 'RECOVERY' : 'VACCINATION'
    const eudccEntry = passType === 'VACCINATION' ? this.state.eudcc?.payload.hcert.v : passType === 'TEST' ? this.state.eudcc?.payload.hcert.t : this.state.eudcc?.payload.hcert.r
    const [eudcc] = eudccEntry || []
    return <table>
      <tbody>
      <tr>
        <td>
          <h4>{this.state.docType === DocType.EUDCC ? 'EU Digital COVID Certificate' : '2D-Doc'}</h4>
          {<img src={bwipjs.toCanvas('.bwipjs', {
            bcid: this.state.docType === DocType.EUDCC ? 'qrcode' : 'datamatrix',
            scale: 3,
            text: this.props.data.trim()
          }).toDataURL()}/>}
          <p
            className="name">{this.state.eudcc?.payload.hcert.nam?.gn || this.state.ddoc?.first_name} {this.state.eudcc?.payload.hcert.nam?.fn || this.state.ddoc?.last_name}</p>
          <p>Date of
            birth {this.state.eudcc?.payload.hcert.dob || formatISODate(this.state.ddoc?.date_of_birth as Date)}</p>
        </td>
        <td>
          <h2>{passType}</h2>
          <table className="infos">
            <tbody>
            {this.state.docType === DocType.EUDCC ? EUCCInfoTable(passType, eudcc) : DDOCInfoTable(this.state.ddoc as CommonCertificateInfo)}
            </tbody>
          </table>
          {this.state.docType === DocType.EUDCC && <p
            className="fingerprint">{crypto.createHash('sha256').update(eudcc?.co.toUpperCase() as string + eudcc?.ci).digest('hex')}</p>}
        </td>
      </tr>
      </tbody>
    </table>
  }
}
