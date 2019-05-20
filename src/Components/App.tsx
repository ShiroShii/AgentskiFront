import React from 'react';
import { Component } from 'react';
import axios from 'axios';
import AgentWrapper from '../Models/AgentWrapper';
import uuidv4 from 'uuid/v4';

interface IAgentState{
  messageTypes: string[];
  classes: string[];
  classesSocket: WebSocket;
  runningAgents: AgentWrapper[];
  runningAgentsSocket: WebSocket;
  logs: string [];
  loggerSocket: WebSocket;
  createInstanceClass: string;
  createInstanceName: string;
  selectedMessageType: string;
  sender: string;
  reciever: string;
  message: string;
}

 class App extends Component<any, IAgentState>{

  constructor(props: any){
    super(props);
    this.state = {
      messageTypes : [],
      classes : [],
      classesSocket: new WebSocket('ws://localhost:8080/AgentTechnology/refreshAgentClasses'),
      runningAgents : [],
      runningAgentsSocket : new WebSocket('ws://localhost:8080/AgentTechnology/refreshRunningAgents'),
      logs : [],
      loggerSocket : new WebSocket('ws://localhost:8080/AgentTechnology/logger'),
      createInstanceClass : '',
      createInstanceName : '',
      selectedMessageType: '',
      sender: '',
      reciever: '',
      message: ''
    }

    this.state.classesSocket.onmessage = evt => {
      this.setState({
      	classesSocket : JSON.parse(evt.data).list
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

      if(this.state.runningAgents.length > 0){
        this.setState({
          sender : '0',
          reciever : '0',
        })
      }
      else{
        this.setState({
          sender : '',
          reciever : '',
        })
      }
    }

    this.state.loggerSocket.onmessage = evt => {
      this.state.logs.push(evt.data);
    }

    this.handleCreateInstanceClassChange = this.handleCreateInstanceClassChange.bind(this);
    this.handleCreateInstanceNameChange = this.handleCreateInstanceNameChange.bind(this);
    this.handleSelectedMessageTypeChange = this.handleSelectedMessageTypeChange.bind(this);
    this.handleSendMessage = this.handleSendMessage.bind(this);
    this.handleSenderChange = this.handleSenderChange.bind(this);
    this.handleRecieverChange = this.handleRecieverChange.bind(this);
    this.handleMessageChange = this.handleMessageChange.bind(this);
    this.handleCreate = this.handleCreate.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
  }


  public componentDidMount(){
    this.loadMessageTypes();
    this.loadClasses();
    this.loadRunningAgents();
  }

  private loadMessageTypes(){
    let url = 'http://localhost:8080/AgentTechnology/rest/messages';

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
    let url = 'http://localhost:8080/AgentTechnology/rest/agents/classes/';

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
    let url = 'http://localhost:8080/AgentTechnology/rest/agents/running/';

        axios.get(url)
            .then(res => {
                this.setState({
                  runningAgents: res.data.list
        });
        if(this.state.runningAgents.length > 0){
          this.setState({
            sender : '0',
            reciever : '0',
          })
        }      
        else{
          this.setState({
            sender : '',
            reciever : '',
          })
        }
    })
  }

  private handleCreate(event:any){
    event.preventDefault();
    let url = 'http://localhost:8080/AgentTechnology/rest/agents/running/'+this.state.createInstanceClass+'/'+this.state.createInstanceName;
    axios.post(url);
  }

  private handleDelete(agentClass: string, agentName: string){
    let url = 'http://localhost:8080/AgentTechnology/rest/agents/running/'+agentClass+'/'+agentName;
    axios.delete(url);
  }

  private handleSendMessage(event:any){
    event.preventDefault();
    let url = 'http://localhost:8080/AgentTechnology/rest/messages';

    let sender = this.state.runningAgents[Number(this.state.sender)];
    let reciever = this.state.runningAgents[Number(this.state.reciever)];

    axios.post(url,{
        "performative": this.state.selectedMessageType,
        "conversationID": uuidv4(),
        "sender": sender.aid,
        "receivers":[ reciever.aid]
      }
    );
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

  private handleSenderChange(event: any) {
    this.setState({
        sender: event.target.value
    })
  }

  private handleRecieverChange(event: any) {
    this.setState({
        reciever: event.target.value
    })
  }

  private handleMessageChange(event: any) {
    this.setState({
        message: event.target.value
    })
  }

   public render(){
     return (
       <div>       
      <h1>Classes</h1>
      <form onSubmit={this.handleCreate}>
        <select value={this.state.createInstanceClass} onChange={this.handleCreateInstanceClassChange}>
        {this.state.classes.map((item) => (
          <option>{item}</option>
      ))}
        </select>
        <input placeholder="Enter instance name..." value={this.state.createInstanceName} onChange={this.handleCreateInstanceNameChange}></input>
        <input type="submit" value="Submit" disabled={this.state.createInstanceClass.trim() ==="" || this.state.createInstanceName.trim() ===""}></input>
      </form>      
      <br/>
      <h1>Running Agents</h1>
      <table>
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
      <label>Sender: </label>
        <select value={this.state.sender} onChange={this.handleSenderChange}>
        {this.state.runningAgents.map((item,index) => (
          <option value ={index}>{item.aid.name}</option>
      ))}
        </select>
        <br/>
        <label>Reciever: </label>
        <select value={this.state.reciever} onChange={this.handleRecieverChange}>
        {this.state.runningAgents.map((item,index) => (
          <option value ={index}>{item.aid.name}</option>
      ))}
        </select>
        <br/>
        <label>Message type: </label>
        <select value={this.state.selectedMessageType} onChange={this.handleSelectedMessageTypeChange}>
        {this.state.messageTypes.map(item => (
          <option>{item}</option>
      ))}
        </select>
        <br/>    
        <input placeholder="Enter message..." value={this.state.message} onChange={this.handleMessageChange}></input>
        <input type="submit" value="Submit" disabled={this.state.sender.trim()==="" || this.state.reciever.trim()==="" || this.state.message.trim() ==="" || this.state.selectedMessageType.trim() ===""}></input>
      </form>
      <br/>
      <h1>Logs</h1>
      <ul>
      {this.state.logs.map(item =>(
        <li>{item}</li>
      ))}
      </ul>
       </div>
     )
   }
}

export default App;