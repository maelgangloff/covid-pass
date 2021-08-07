import React from 'react';
import ReactDOM from 'react-dom'
import {CovidCard} from './components/CovidCard'

interface State {
  hcert: string,
  cards: JSX.Element[]
}
class App extends React.Component<object, State> {

  constructor(props: object) {
    super(props)
    this.state = {hcert: '', cards: []}
  }

  render() {
    console.log(this.state)
    return <>
      <div className="jumbotron noprint">
        <h3>This is a tool for printing your EU Digital COVID Certificate.</h3>
        <p>Scan your qr code with a qr code decoder app then copy the text starting with 'HC1:' and insert it below.</p>

        <div className="input-group input-group-sm">
          <input className='form-control' type="text" value={this.state.hcert} onChange={(e) => this.setState({hcert: e.target.value})} placeholder="HC1:" />
          <div className="input-group-append">
            <button className='btn btn-success btn-sm' onClick={() => {
              if(this.state.hcert.startsWith('HC1:')) {
                this.setState({cards: [...this.state.cards, <CovidCard hcert={this.state.hcert} />]})
              } else {
                alert('QR data must starts with HC1:')
              }
            }}>Append</button>
            <button className='btn btn-danger btn-sm' onClick={() => this.setState({cards: []})}>Clear</button>
            <button className='btn btn-secondary btn-sm' onClick={() => window.print()}>Print</button>
            </div>
        </div>
      </div>
      <div id="cards">{
        this.state.cards
      }</div>
    </>
  }
}

export default App;
