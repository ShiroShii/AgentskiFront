import React from 'react';
import { Component } from 'react';
import axios from 'axios';
import AgentWrapper from '../Models/AgentWrapper';
import SearchResult from '../Models/SearchResult';
import AID from '../Models/AID';
import uuidv4 from 'uuid/v4';

interface IAgentState{
  messageTypes: string[];
  classes: string[];
  classesSocket: WebSocket;
  runningAgents: AgentWrapper[];
  localRunningAgents: AgentWrapper[];
  runningAgentsSocket: WebSocket;
  searchResultsSocket: WebSocket;
  logs: string [];
  loggerSocket: WebSocket;
  createInstanceClass: string;
  createInstanceName: string;
  selectedMessageType: string;
  sender: string;
  reciever: string;
  message: string;
  senderRequired: boolean;
  messageRequired: boolean;
  searchResults: SearchResult[];
}

interface IMessageData{
  performative: string,
  conversationID: string,
  receivers: AID[],
  sender?: AID,
  content?: string
}

 class App extends Component<any, IAgentState>{

  constructor(props: any){
    super(props);
    this.state = {
      messageTypes : [],
      classes : [],
      classesSocket: new WebSocket('ws://'+this.getHostAddress()+'refreshAgentClasses'),
      runningAgents : [],
      localRunningAgents : [],
      runningAgentsSocket : new WebSocket('ws://'+this.getHostAddress()+'refreshRunningAgents'),
      logs : [],
      loggerSocket : new WebSocket('ws://'+this.getHostAddress()+'logger'),
      searchResultsSocket : new WebSocket('ws://'+this.getHostAddress()+'searchResults'),
      createInstanceClass : '',
      createInstanceName : '',
      selectedMessageType: '',
      sender: '',
      senderRequired: false,
      searchResults: [],
      reciever: '',
      message: '',
      messageRequired: false
    }

    this.state.classesSocket.onmessage = evt => {
      this.setState({
      	classes : JSON.parse(evt.data).list
      })

      if(this.state.classes.length > 0 ){
        this.setState({
          createInstanceClass : this.state.classes[0]
        });
      }
    }

    this.state.runningAgentsSocket.onmessage = evt => {
      this.setState({
      	runningAgents : JSON.parse(evt.data).list
      })

      this.setState(
      {
        localRunningAgents: (this.state.runningAgents.filter((runningAgent) =>
          runningAgent.aid.host.address === window.location.host))
        })

        if(this.state.runningAgents.length > 0){
          this.setState({
            reciever : '0'
          })
        }
        else{
          this.setState({
            reciever : '',
          })
        }

      if(this.state.localRunningAgents.length > 0){
        this.setState({
          sender : '0'
        })
      }
      else{
        this.setState({
          sender : ''
        })
      }
    }

    this.state.loggerSocket.onmessage = evt => {
      this.setState(prevState => ({
        logs: [...prevState.logs, evt.data]
      }))
    }

    this.state.searchResultsSocket.onmessage = evt => {
      this.setState({
        searchResults : JSON.parse(evt.data).list
      })
    }

    this.handleCreateInstanceClassChange = this.handleCreateInstanceClassChange.bind(this);
    this.handleCreateInstanceNameChange = this.handleCreateInstanceNameChange.bind(this);
    this.handleSelectedMessageTypeChange = this.handleSelectedMessageTypeChange.bind(this);
    this.handleSendMessage = this.handleSendMessage.bind(this);
    this.handleSenderChange = this.handleSenderChange.bind(this);
    this.handleSenderRequiredChange = this.handleSenderRequiredChange.bind(this);
    this.handleRecieverChange = this.handleRecieverChange.bind(this);
    this.handleMessageRequiredChange = this.handleMessageRequiredChange.bind(this);
    this.handleMessageChange = this.handleMessageChange.bind(this);
    this.handleCreate = this.handleCreate.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.clearLogs = this.clearLogs.bind(this);
  }


  public componentDidMount(){
    this.loadMessageTypes();
    this.loadClasses();
    this.loadRunningAgents();
  }

  private getHostAddress(){
    var url : string = window.location.href;
    return url.replace(/(^\w+:|^)\/\//, '');
  }

  private loadMessageTypes(){
    let url = window.location.href+'rest/messages';

        axios.get(url)
            .then(res => {
                this.setState({
                  messageTypes: res.data});

                  if(this.state.messageTypes.length > 0 ){
                    this.setState({
                      selectedMessageType : this.state.messageTypes[0]
                    });
                  }
    })
  }

  private loadClasses(){
    let url = window.location.href+'rest/agents/classes/';

        axios.get(url)
            .then(res => {
                this.setState({
                  classes: res.data.list});

                  if(this.state.classes.length > 0 ){
                    this.setState({
                      createInstanceClass : this.state.classes[0]
                    });
                  }
    })
  }

  private loadRunningAgents(){
    let url = window.location.href+'rest/agents/running/';

        axios.get(url)
            .then(res => {
                this.setState({
                  runningAgents: res.data.list
        });
        this.setState(
          {
            localRunningAgents: (this.state.runningAgents.filter((runningAgent) =>
              runningAgent.aid.host.address === window.location.host))
            })
    
            if(this.state.runningAgents.length > 0){
              this.setState({
                reciever : '0'
              })
            }
            else{
              this.setState({
                reciever : '',
              })
            }
    
          if(this.state.localRunningAgents.length > 0){
            this.setState({
              sender : '0'
            })
          }
          else{
            this.setState({
              sender : ''
            })
          }
    })
  }

  private handleCreate(event:any){
    event.preventDefault();
    let url = window.location.href+'rest/agents/running/'+this.state.createInstanceClass+'/'+this.state.createInstanceName;
    axios.post(url);
  }

  private handleDelete(agentClass: string, agentName: string){
    let url = window.location.href+'rest/agents/running/'+agentClass+'/'+agentName;
    axios.delete(url);
  }

  private handleSendMessage(event:any){
    event.preventDefault();
    let url = window.location.href+'rest/messages';

    let sender = this.state.localRunningAgents[Number(this.state.sender)];
    let reciever = this.state.runningAgents[Number(this.state.reciever)];
    var data : IMessageData;
    data = {
      performative: this.state.selectedMessageType,
      conversationID: uuidv4(),
      receivers:[ reciever.aid]
    }

    if(this.state.senderRequired){
      data.sender = sender.aid
    }

    if(this.state.messageRequired){
      data.content = this.state.message
    }

    axios.post(url, data);
  }
  
  private handleCreateInstanceClassChange(event: any) {
    this.setState({
        createInstanceClass: event.target.value
    })
  }

  private handleCreateInstanceNameChange(event: any) {
    this.setState({
        createInstanceName: event.target.value
    })
  }

  private handleSelectedMessageTypeChange(event: any) {
    this.setState({
        selectedMessageType: event.target.value
    })
  }

  private handleSenderRequiredChange(event: any) {
    this.setState({
        senderRequired: event.target.checked
    })
  }

  private handleSenderChange(event: any) {
    this.setState({
        sender: event.targsenet.value
    })
  }

  private handleRecieverChange(event: any) {
    this.setState({
        reciever: event.target.value
    })
  }

  private handleMessageRequiredChange(event: any) {
    this.setState({
        messageRequired: event.target.checked
    })
  }

  private handleMessageChange(event: any) {
    this.setState({
        message: event.target.value
    })
  }

  private clearLogs(event: any) {
    this.setState({
        logs: []
    })
  }

   public render(){
     return (
      <div style={{ width: "50em", marginLeft:"auto", marginRight:"auto"}}>       
      <h1>Classes</h1>
      <div style={{marginLeft:"3em"}}>
      <form onSubmit={this.handleCreate}>
        <select value={this.state.createInstanceClass} onChange={this.handleCreateInstanceClassChange}>
        {this.state.classes.map((item) => (
          <option>{item}</option>
      ))}
        </select>
        &emsp;
        <input placeholder="Enter instance name..." value={this.state.createInstanceName} onChange={this.handleCreateInstanceNameChange}></input>
        &emsp;
        <input type="submit" value="Submit" disabled={this.state.createInstanceClass.trim() ==="" || this.state.createInstanceName.trim() ===""}></input>
      </form> 
      </div>     
      <br/>
      <h1>Running Agents</h1>
      <table style={{marginLeft:"3em", borderSpacing: "0.5em"}}>
        <tbody>
          {this.state.runningAgents.map(item =>(
            <tr>
              <td>{item.aid.name}</td>
              <td><button onClick={() => this.handleDelete(item.aid.type.name, item.aid.name)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <br/>
      <h1>Messages</h1>
      <form onSubmit={this.handleSendMessage}>
      <table style={{marginLeft:"3em", borderSpacing: "0.5em"}}>
      <tbody>
        <tr>
      <td>Sender: </td>
      <td><input type="checkbox" checked={this.state.senderRequired} onChange={this.handleSenderRequiredChange}></input>
      <select value={this.state.sender} onChange={this.handleSenderChange} disabled={!this.state.senderRequired}>
        {this.state.localRunningAgents.map((item,index) => (
          <option value ={index}>{item.aid.name}</option>
      ))}
        </select>
        </td>
        </tr>
        <tr>
        <td>Reciever: </td>
        <td> &emsp; <select value={this.state.reciever} onChange={this.handleRecieverChange}>
        {this.state.runningAgents.map((item,index) => (
          <option value ={index}>{item.aid.name}</option>
      ))}
        </select>
        </td>
        </tr>
        <tr>
        <td>Message type: </td>
        <td> &emsp; <select value={this.state.selectedMessageType} onChange={this.handleSelectedMessageTypeChange}>
        {this.state.messageTypes.map(item => (
          <option>{item}</option>
      ))}
        </select>
        </td>
        </tr>
        <tr>
        <td>Message: </td>        
        <td>
        <input type="checkbox" checked={this.state.messageRequired} onChange={this.handleMessageRequiredChange}></input> 
        <input placeholder="Enter message..." value={this.state.message} onChange={this.handleMessageChange} disabled={!this.state.messageRequired}></input>
        </td>
        </tr>
        <tr>
        <input type="submit" value="Submit" disabled={(this.state.sender.trim()==="" && this.state.senderRequired === true) || this.state.reciever.trim()==="" || (this.state.message.trim() ==="" && this.state.messageRequired === true) || this.state.selectedMessageType.trim() ===""}></input>
        </tr>
      </tbody>
      </table>
      </form>
      <br/>
      <h1>Logs</h1>
      <div style={{ marginLeft:"3em"}}>
        <button onClick={this.clearLogs}>Clear</button>
        <div style={{ paddingLeft: "1em", paddingRight:"1em", paddingTop:"1em", paddingBottom:"1em", height: "6.5em", marginTop:"1em", overflowY:"scroll", border: "solid", borderWidth:"0.01em"}}>
        {this.state.logs.map(item =>(
          <p>{item}</p>
        ))}
        </div>
      </div>
      <br/>
      <h1>Search results</h1>
      <table style={{marginLeft:"3em"}}>
        <tbody>
        {this.state.searchResults.map(item =>(
          <tr style={{backgroundColor:"#ACF3D3"}}>
            <div>
              <p style={{float : "left"}}>{item.name}</p>
              <p style={{float : "right"}}><a href={item.url}>{item.url}</a></p>
            </div>
              <p style={{float:"left", clear:"both"}}>{item.description}</p>
            <br/>
          </tr>
        ))}
        </tbody>
      </table> 
      </div>
     )
   }
}

export default App;