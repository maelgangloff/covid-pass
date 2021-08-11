import React from 'react'
import { CovidCard, DDOC_PREFIX, EUDCC_PREFIX } from './components/CovidCard'
import { Button, Jumbotron, Modal } from 'react-bootstrap'
import QrReader from 'react-qr-reader'

const TAC_WALLET_DCC_URL = `https://bonjour.tousanticovid.gouv.fr/app/walletdcc#${EUDCC_PREFIX}`
const TAC_WALLET_DDOC_URL = 'https://bonjour.tousanticovid.gouv.fr/app/wallet?v='

interface State {
  hcert: string
  cards: JSX.Element[]
  isScanning: boolean
}

class App extends React.Component<object, State> {
  constructor (props: object) {
    super(props)
    this.state = {
      isScanning: false,
      hcert: '',
      cards: []
    }
    this.onAppend = this.onAppend.bind(this)
    this.appendHCERT = this.appendHCERT.bind(this)
    this.onScan = this.onScan.bind(this)
  }

  appendHCERT (hcert?: string) {
    const newCards = (hcert ?? this.state.hcert).trim().split('\n').filter(e => e.startsWith(EUDCC_PREFIX) || e.startsWith(DDOC_PREFIX)).map(e =>
      <CovidCard key={Date.now()} data={e}/>)
    this.setState({
      cards: [...this.state.cards, ...newCards],
      hcert: '',
      isScanning: false
    })
  }

  onScan (qr: string | null) {
    if (qr === null) return
    if (qr.startsWith(EUDCC_PREFIX) || qr.startsWith(DDOC_PREFIX)) {
      return this.appendHCERT(qr)
    }
    if (qr.startsWith(TAC_WALLET_DCC_URL)) {
      return this.appendHCERT(decodeURI(qr.replace(TAC_WALLET_DCC_URL.substr(0, TAC_WALLET_DCC_URL.length - EUDCC_PREFIX.length), '')))
    }
    if (qr.startsWith(TAC_WALLET_DDOC_URL)) {
      return this.appendHCERT(decodeURI(qr.replace(TAC_WALLET_DDOC_URL, '')))
    }
  }

  onAppend () {
    if (!this.state.hcert.startsWith(EUDCC_PREFIX) && !this.state.hcert.startsWith(DDOC_PREFIX)) {
      return alert(`QR content must starts with ${EUDCC_PREFIX} or ${DDOC_PREFIX}`)
    }
    this.appendHCERT(this.state.hcert)
  }

  render () {
    return <>
      <Modal show={this.state.isScanning} animation={false}>
        <Modal.Header closeButton>
          <Modal.Title>Scan QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <QrReader
            onScan={this.onScan}
            onError={console.log}
            facingMode='environment'
            style={{ width: '100%' }}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => this.setState({ isScanning: false })}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Jumbotron fluid={true} className='noprint'>
        <h3>Imprimer Pass sanitaire / <span className='en'>Print Digital COVID Certificate</span></h3>
        <p>Toutes les étapes sont effectuées sur votre terminal. Aucun échange de données n&apos;est effectué entre
          votre appareil et le serveur une fois la page chargée. <br/> <span className="en">This tool respects your personal data. The certificate is decoded on your device and no
          information
          about it is sent anywhere.</span></p>
        <div className="input-group input-group">
          <button className='btn btn-outline-dark' onClick={() => this.setState({ isScanning: true })}>📷</button>
          <textarea className='form-control' value={this.state.hcert}
                    onChange={({ target }) => this.setState({ hcert: target.value })}
                    placeholder={`${EUDCC_PREFIX} | ${DDOC_PREFIX}`}/>
          <div className="btn-group">
            <Button variant="success" onClick={this.onAppend}>✅</Button>
            <Button variant='secondary' onClick={window.print}>🖨️</Button>
            <Button variant='danger' onClick={() => this.setState({ cards: [], hcert: '' })}>🗑</Button>
          </div>
        </div>
        <br/>
      </Jumbotron>
      <div id="cards">{this.state.cards}</div>
    </>
  }
}

export default App
