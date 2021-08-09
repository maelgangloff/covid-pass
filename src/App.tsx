import React from 'react';
import {CovidCard} from './components/CovidCard'
import {Modal, Button, Jumbotron} from "react-bootstrap"
import QrReader from "react-qr-reader"

interface State {
  hcert: string,
  cards: JSX.Element[],
  isScanning: boolean
}

class App extends React.Component<object, State> {

  constructor(props: object) {
    super(props)
    this.state = {
      isScanning: false,
      hcert: '',
      cards: []
    }
    this.onAppend = this.onAppend.bind(this)
    this.appendHCERT = this.appendHCERT.bind(this)
  }

  appendHCERT(hcert?: string) {
    const newCards = (hcert ?? this.state.hcert).trim().split('\n').filter(e => e.startsWith('HC1:')).map((e: string) => <CovidCard hcert={e} />)
    this.setState({
      cards: [...this.state.cards, ...newCards],
      hcert: '',
      isScanning: false
    })
  }

  onAppend() {
    if (!this.state.hcert.startsWith('HC1:')) {
      return alert('QR content must starts with HC1:')
    }
    this.appendHCERT(this.state.hcert)
  }

  render() {
    return <>
      <Modal show={this.state.isScanning} animation={false}>
        <Modal.Header closeButton>
          <Modal.Title>Scan QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <QrReader
            onScan={hcert => hcert !== null && hcert.startsWith('HC1:') && this.appendHCERT(hcert)}
            onError={console.log}
            facingMode='environment'
            style={{width: '100%'}}
            showViewFinder={true}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => this.setState({isScanning: false})}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Jumbotron fluid={true} className='noprint'>
        <h3>Print EU Digital COVID Certificate</h3>
        <p>This tool respects your personal data. The COVID certificate is decoded on your device and no information about it is sent anywhere.</p>
        <div className="input-group input-group">
          <button className='btn btn-outline-dark' onClick={() => this.setState({isScanning: true})}>📷</button>
          <textarea className='form-control' value={this.state.hcert}
                 onChange={({target}) => this.setState({hcert: target.value})} placeholder="HC1:"/>
          <div className="btn-group">
            <Button variant="success" onClick={this.onAppend}>✅</Button>
            <Button variant='secondary' onClick={window.print}>🖨️</Button>
            <Button variant='danger' onClick={() => this.setState({cards: [], hcert: ''})}>🗑</Button>
          </div>
        </div>
        <br/>
      </Jumbotron>
      <div id="cards">{this.state.cards}</div>
    </>
  }
}

export default App;
