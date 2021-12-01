import React from 'react'
import { CovidCard } from './components/CovidCard'
import { Button, Jumbotron, Modal } from 'react-bootstrap'
import QrReader from 'react-qr-reader'
import { EUDCC_PREFIX } from './converters/eudcc'
import { DDOC_PREFIX } from './converters/2ddoc'

const TAC_WALLET_DCC_URL = 'https://bonjour.tousanticovid.gouv.fr/app/walletdcc#'
const TAC_WALLET_DDOC_URL = 'https://bonjour.tousanticovid.gouv.fr/app/wallet?v='

interface State {
  hcert: string
  cards: JSX.Element[]
  isScanning: boolean
  isSettingsVisible: boolean
  isWithAd: boolean
  count: number
}

class App extends React.Component<object, State> {
  constructor (props: object) {
    super(props)
    this.state = {
      isScanning: false,
      isSettingsVisible: false,
      isWithAd: true,
      hcert: '',
      cards: [],
      count: 1
    }
    this.onAppend = this.onAppend.bind(this)
    this.appendHCERT = this.appendHCERT.bind(this)
    this.onScan = this.onScan.bind(this)
  }

  /**
   * Ajouter une carte à partir des données du code bidimensionnel.
   * @param hcert La donnée du code bidimensionnel.
   */
  appendHCERT (hcert: string) {
    const newCards = []
    for (let i = 0; i < this.state.count; i++) {
      newCards.push(...hcert.trim().split('\n').filter(e => e.startsWith(EUDCC_PREFIX) || e.startsWith(DDOC_PREFIX)).map((e: string, k: number) =>
        <CovidCard key={Date.now() + k} data={e} isWithAd={this.state.isWithAd}/>))
    }
    this.setState({
      cards: [...this.state.cards, ...newCards]
    })
  }

  /**
   * @param qr La donnée décodée à partir du code QR.
   */
  onScan (qr: string | null) {
    if (qr === null) return
    this.setState({ isScanning: false })
    if (qr.startsWith(EUDCC_PREFIX) || qr.startsWith(DDOC_PREFIX)) return this.appendHCERT(qr)
    if (qr.startsWith(TAC_WALLET_DCC_URL)) return this.appendHCERT(decodeURIComponent(qr.replace(TAC_WALLET_DCC_URL, '')))
    if (qr.startsWith(TAC_WALLET_DDOC_URL)) return this.appendHCERT(decodeURIComponent(qr.replace(TAC_WALLET_DDOC_URL, '')))
  }

  /**
   * Vérifier si le certificat à importer débute par le bon préfixe.
   */
  onAppend () {
    if (!this.state.hcert.startsWith(EUDCC_PREFIX) && !this.state.hcert.startsWith(DDOC_PREFIX)) return alert(`QR content must starts with ${EUDCC_PREFIX} or ${DDOC_PREFIX}`)
    this.setState({ hcert: '' })
    this.appendHCERT(this.state.hcert)
  }

  render () {
    return <>
      <Modal show={this.state.isSettingsVisible} className='noprint'>
        <Modal.Header closeButton>
          <Modal.Title>Paramètres</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="form-group row">
            <label htmlFor="count" className='col-sm-10 col-form-label'>Nombre de cartes par certificat</label>
            <div className="col-sm-2">
              <input id='count' className='form-control' type="number" min={0} value={this.state.count} onChange={({ target }) => this.setState({ count: parseInt(target.value) })}/>
            </div>
            <label htmlFor="adCheckbox" className='col-sm-10 col-form-label'>Afficher l&apos;adresse de l&apos;outil</label>
            <div className="col-sm-2">
              <input className="form-check-input" type="checkbox" id="adCheckbox" checked={this.state.isWithAd} onChange={() => this.setState({ isWithAd: !this.state.isWithAd })}/>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => this.setState({ isSettingsVisible: false })}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={this.state.isScanning} className='noprint'>
        <Modal.Header closeButton>
          <Modal.Title>Scan QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <QrReader
            onScan={this.onScan}
            onError={console.log}
            facingMode='environment'
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => this.setState({ isScanning: false })}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
      <Jumbotron fluid={true} className='noprint'>
        <h3>Imprimer Pass sanitaire <span className='en'>/ Print Digital COVID Certificate</span></h3>
        <p>Toutes les étapes sont effectuées sur votre terminal. Aucun échange de données n&apos;est effectué entre
          votre appareil et le serveur une fois la page chargée. <br/> <span className="en">This tool respects your personal data. The certificate is decoded on your device and no
          information
          about it is sent anywhere.</span></p>
        <div className="input-group">
          <button className='btn btn-outline-dark' onClick={() => this.setState({ isScanning: true })}>📷</button>
          <textarea autoFocus={true} className='form-control' value={this.state.hcert}
                    onChange={({ target }) => this.setState({ hcert: target.value })}
                    placeholder={`${EUDCC_PREFIX} | ${DDOC_PREFIX}`}/>
          <div className="btn-group">
            <Button variant='success' onClick={this.onAppend}>✅</Button>
            <Button variant='warning' onClick={() => this.setState({ isSettingsVisible: true })}>🔧</Button>
            <Button variant='danger' onClick={() => this.setState({ cards: [], hcert: '' })}>🗑</Button>
            <Button variant='secondary' onClick={window.print}>🖨️</Button>
          </div>
        </div>
        <br/>
      </Jumbotron>
      <div id="cards">{this.state.cards}</div>
    </>
  }
}

export default App
