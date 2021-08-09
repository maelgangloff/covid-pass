import React from 'react'
import { CovidCard, HCERT_PREFIX } from './components/CovidCard'
import { Modal, Button, Jumbotron } from 'react-bootstrap'
import QrReader from 'react-qr-reader'

const TAC_WALLET_DCC_URL = `https://bonjour.tousanticovid.gouv.fr/app/walletdcc#${HCERT_PREFIX}`

interface State {
  hcert: string,
  cards: JSX.Element[],
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
    const newCards = (hcert ?? this.state.hcert).trim().split('\n').filter(e => e.startsWith(HCERT_PREFIX)).map((e: string) =>
      <CovidCard key={e} hcert={e}/>)
    this.setState({
      cards: [...this.state.cards, ...newCards],
      hcert: '',
      isScanning: false
    })
  }

  onScan (qr: string | null) {
    if (qr === null) return
    if (qr.startsWith(HCERT_PREFIX)) {
      return this.appendHCERT(qr)
    }
    if (qr.startsWith(TAC_WALLET_DCC_URL)) {
      console.log(qr)
      return this.appendHCERT(decodeURI(qr.replace(TAC_WALLET_DCC_URL.substr(0, TAC_WALLET_DCC_URL.length - HCERT_PREFIX.length), '')))
    }
  }

  onAppend () {
    if (!this.state.hcert.startsWith(HCERT_PREFIX)) {
      return alert(`QR content must starts with ${HCERT_PREFIX}`)
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
            showViewFinder={true}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => this.setState({ isScanning: false })}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Jumbotron fluid={true} className='noprint'>
        <h3>Print EU Digital COVID Certificate</h3>
        <p>This tool respects your personal data. The COVID certificate is decoded on your device and no information
          about it is sent anywhere.</p>
        <div className="input-group input-group">
          <button className='btn btn-outline-dark' onClick={() => this.setState({ isScanning: true })}>📷</button>
          <textarea className='form-control' value={this.state.hcert}
                    onChange={({ target }) => this.setState({ hcert: target.value })} placeholder={HCERT_PREFIX} />
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
