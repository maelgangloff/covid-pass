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
  }

  onAppend() {
    if (this.state.hcert.startsWith('HC1:')) {
      this.setState({cards: [...this.state.cards, <CovidCard hcert={this.state.hcert}/>]})
    } else {
      throw new Error('QR data must starts with HC1:')
    }
  }

  render() {
    return <>
      <Modal show={this.state.isScanning} animation={false}>
        <Modal.Header closeButton>
          <Modal.Title>Scan QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <QrReader
            onScan={hcert => hcert !== null && this.setState({hcert, isScanning: false})}
            onError={console.log}
            facingMode='environment'
            style={{width: '100%'}}
            showViewFinder={false}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => this.setState({isScanning: false})}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Jumbotron fluid={true} className='noprint'>
        <h3>A tool for printing your EU Digital COVID Certificate.</h3>
        <div className="input-group input-group-sm">
          <button className='btn btn-outline-dark btn-sm' onClick={() => this.setState({isScanning: true})}>Scan QR
            Code
          </button>
          <input className='form-control' type="text" value={this.state.hcert}
                 onChange={(e) => this.setState({hcert: e.target.value})} placeholder="HC1:"/>
          <div className="input-group-append">
            <Button variant="success" size='sm' onClick={this.onAppend}>Append</Button>
            <Button variant='danger' size='sm' onClick={() => this.setState({cards: []})}>Clear</Button>
            <Button variant='secondary' size='sm' onClick={window.print}>Print</Button>
          </div>
        </div>
      </Jumbotron>
      <div id="cards">{this.state.cards}</div>
    </>
  }
}

export default App;
